from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()
    page.goto("http://localhost:5000/current-affairs")
    page.click("a:has-text('article1')")
    page.screenshot(path="jules-scratch/verification/current-affairs-article.png")
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
