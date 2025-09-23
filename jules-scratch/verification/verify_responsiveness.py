from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Practice test list - medium screen
    page.set_viewport_size({"width": 768, "height": 1024})
    page.goto("http://localhost:5173/practice-test")
    page.wait_for_load_state("networkidle")
    print(page.content())
    page.screenshot(path="jules-scratch/verification/practice-test-list-medium.png")

    context.close()
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
