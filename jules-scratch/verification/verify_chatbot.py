from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()
    page.goto("http://localhost:5000")

    # Click the chatbot icon
    page.locator("button.chatbot-button").click()

    # Wait for the chatbot to be visible
    chatbot = page.locator(".chatbot-card")
    expect(chatbot).to_be_visible()

    # Type a message and send it
    page.locator('input[placeholder="Type your message..."]').fill("Hello, supervisor!")
    page.get_by_role("button", name="Send").click()

    # Wait for the response
    expect(page.locator(".prose").last).to_contain_text("supervisor")

    page.screenshot(path="jules-scratch/verification/chatbot_verification.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)