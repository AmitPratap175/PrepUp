from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:5000/index.html")
        page.get_by_label("Email").fill("test@example.com")
        page.get_by_label("Password").fill("testpassword")
        page.get_by_role("button", name="Login").click()
        page.wait_for_url("http://localhost:5000/dashboard")
        page.goto("http://localhost:5000/words")
        page.screenshot(path="jules-scratch/verification/words_page.png")
        browser.close()

if __name__ == "__main__":
    run()