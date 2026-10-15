"""Pruebas del HTML autonomo; persistencia simulada en Storage en memoria.
Requiere pytest, playwright y Chromium (opcional CHROMIUM_EXECUTABLE).
"""
import os
import re
from pathlib import Path
import pytest
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]

@pytest.fixture(scope='session')
def browser():
    with sync_playwright() as p:
        executable = os.environ.get('CHROMIUM_EXECUTABLE') or ('/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None)
        b = p.chromium.launch(executable_path=executable, headless=True, args=['--no-sandbox'])
        yield b
        b.close()

@pytest.fixture
def page(browser):
    context = browser.new_context(viewport={'width': 1440, 'height': 1000}, device_scale_factor=1)
    p = context.new_page()
    p.set_default_timeout(5000)
    p.evaluate("Object.defineProperty(window, 'localStorage', {value: (() => {const s=new Map();return {getItem:k=>s.get(k)??null,setItem:(k,v)=>s.set(k,String(v)),removeItem:k=>s.delete(k)}})(), configurable:true})")
    p.set_content((ROOT / 'ABRIR-DISENO.html').read_text(), wait_until='load')
    p.wait_for_load_state('load')
    yield p
    context.close()

def visible_products(page):
    return page.locator('[data-product]:visible')

def test_complete_design_and_images(page):
    assert 'Florella' in page.title()
    assert 'honran su memoria' in page.locator('h1').inner_text()
    assert visible_products(page).count() == 5
    assert page.evaluate('Array.from(document.images).every(i => i.complete && i.naturalWidth > 0)')

def test_occasion_and_reset(page):
    page.locator('[data-occasion="Cruces"]').click()
    assert visible_products(page).count() == 1
    assert visible_products(page).first.get_attribute('data-id') == 'cruz-flores-naturales'
    page.locator('[data-occasion="Todas"]').click()
    assert visible_products(page).count() == 5

def test_search_and_empty_state(page):
    page.get_by_role('button', name='Buscar flores').click()
    page.get_by_placeholder(re.compile('Corona')).fill('corona')
    assert visible_products(page).count() == 2
    page.get_by_placeholder(re.compile('Corona')).fill('xxningunaflorxx')
    assert visible_products(page).count() == 0
    assert page.locator('#empty-products').is_visible()
    page.get_by_role('button', name='Ver todos los arreglos').click()
    assert visible_products(page).count() == 5

def test_favorites_and_simulated_persistence(page):
    page.locator('[data-favorite="corona-clasica-blanca"]').click()
    assert page.locator('[data-favorite="corona-clasica-blanca"]').get_attribute('aria-pressed') == 'true'
    page.set_content((ROOT / 'ABRIR-DISENO.html').read_text(), wait_until='load')
    assert page.locator('[data-favorite="corona-clasica-blanca"]').get_attribute('aria-pressed') == 'true'
    page.get_by_role('button', name='Ver mis favoritos').click()
    assert visible_products(page).count() == 1
    page.get_by_role('button', name='Mostrar todo el catálogo').click()
    assert visible_products(page).count() == 5

def test_empty_cart_and_dialogs(page):
    page.get_by_role('button', name=re.compile('Abrir carrito')).click()
    assert page.locator('#cart-dialog').is_visible()
    assert page.locator('#empty-cart').is_visible()
    assert page.locator('#checkout').is_disabled()
    page.keyboard.press('Escape')
    assert not page.locator('#cart-dialog').is_visible()
    page.get_by_role('button', name='Contacto', exact=True).first.click()
    assert page.locator('#contact-dialog').is_visible()
    page.keyboard.press('Escape')
    assert not page.locator('#contact-dialog').is_visible()

def test_bad_local_storage_is_ignored(page):
    page.evaluate("localStorage.setItem('florella-cart-v1', '{bad'); localStorage.setItem('florella-favorites-v1', '{}')")
    page.set_content((ROOT / 'ABRIR-DISENO.html').read_text(), wait_until='load')
    assert page.locator('[data-cart-count]').inner_text() == '0'
    assert visible_products(page).count() == 5

@pytest.mark.parametrize('width', [360, 390, 768, 1024, 1440])
def test_responsive_without_overflow(page, width):
    page.set_viewport_size({'width': width, 'height': 900})
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1')
    assert visible_products(page).count() == 5
    for i in range(5):
        box = visible_products(page).nth(i).bounding_box()
        assert box['x'] >= 0 and box['x'] + box['width'] <= width + 1

def test_no_browser_errors(page):
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.reload(wait_until='load')
    page.locator('[data-occasion="Cruces"]').click()
    page.locator('[data-occasion="Todas"]').click()
    assert errors == []
