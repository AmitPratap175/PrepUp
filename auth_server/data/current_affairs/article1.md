# Article 1

How does two-factor authentication (2FA) work?
The idea of 2FA is that you prove your identity in two different ways. The first factor is something you know: your password. The second factor is something you have: an authenticator app running on your phone
Vasudevan Mukunth 
What is 2FA?
The idea of 2FA is that you prove your identity in two different ways. The first factor is something you know: your password. The second factor is something you have: an authenticator app running on your phone. This makes attacks harder because an attacker needs both your password and access to your phone to succeed.
OTPs are short numeric codes that work only once, and only within a short time window. Even if someone intercepts one code, it becomes useless 30 seconds later.
TOTP is the system that generates these codes; it’s short for time-based OTPs. TOTP is defined in an open standard so that different apps and services can use the same method and stay compatible. Google Authenticator is one of the best-known implementations.
How does TOTP work?
Before you can generate codes, your authenticator app and the service, like Gmail or Facebook, need to agree on a piece of secret information. This is called the secret key.
When you set up Google Authenticator, the service gives you this secret. Usually, it’s hidden inside a QR code that you scan. Once your phone app has the secret and the service has stored the same secret in its database, both sides are ready. They can now use this key plus the current time to generate the same short codes.
The key idea of TOTP is to use time as a moving input. Time is divided into equal steps, usually 30 seconds long. Each step has a number, called the time counter. For example, if the current time is 2:00:00 PM exactly and we count in 30-second intervals, the counter might be a large number like 50,00,000. At 2:00:30 PM, the counter increases by one.
The app takes two inputs — the shared secret key and the the current time counter.
With these, it runs a cryptographic function to generate a short numeric code. Because the server can also compute the same function with the same two inputs, it can check that your code is valid.
What are hash functions?
The codes are generated using hash functions. A hash function takes an input of any length — like a word, a sentence or a long number — and produces a fixed-length output. For example, the SHA-256 hash function always produces a 256-bit (32-byte) output.
Hash functions are one-way: given the output, it is practically impossible to figure out the original input. They are also very sensitive: if you change just one character in the input, the output changes completely.
These properties make hash functions ideal for security. But TOTP doesn’t use SHA-256 alone. It uses it inside a construction called HMAC.
HMAC stands for ‘hash-based message authentication code’. It’s a clever way to combine a secret key with a message using a hash function. The result is a short piece of data that proves both the authenticity (“it came from someone with the secret key”) and the integrity (“the message was not changed”).
The HMAC formula looks complicated but the idea is straightforward —prepare the key by making sure it has the right length; combine the key with a constant called the inner pad using the XOR function (more on that later); hash it together with the message; combine the key with an outer pad using the XOR function; and hash it together with the result from step 2.
The final output is a 256-bit string. This is much longer than the six digits you see on Google Authenticator. That is where the next step comes in.
How is the final code made?
The HMAC output is 256 bits, or 64 hexadecimal characters. To turn this into a short code, TOTP uses a process called dynamic truncation. It selects a portion of the HMAC output based on its last few bits, then interprets those bits as a number. Finally, it reduces the number by dividing it by 10,00,000 and taking the remainder.
The result is a six-digit number between 000000 and 999999. This is the code you see on your app.
Because the time counter changes every 30 seconds, the code also changes. And because both your app and the server use the same secret and the same counter, they both arrive at the same six-digit number.
What is XOR?
XOR is one of the simplest yet most powerful operations in computer science. Its name is short for “exclusive OR”. It’s a logical operation that works on bits. The rules are simple:
0 XOR 0 = 0
1 XOR 0 = 1
0 XOR 1 = 1
1 XOR 1 = 0
In other words, XOR outputs 1 if the inputs are different and 0 if they are the same. XOR is useful because it’s reversible: A XOR A = 0. Say A XOR B = C. Knowing C, how do you find A?
You do C XOR B because it’s the same as (A XOR B) XOR B. Because B XOR B = 0, you’re left with A.
This property makes the XOR function very handy in cryptography.
In HMAC, the XOR function is used to mix the secret key with the inner and outer pads like so: HMAC_SHA256(key, message) = SHA256( outer_pad XOR ( SHA256(inner_pad XOR message) ) )
This ensures the key is not used directly but in an altered, more secure form.
How secure is TOTP?
The security of TOTP comes from several layers. The secret key is known only to your device and the server. HMAC-SHA-256 ensures that without the key, no one can predict the output. Also, time dependency means that even if someone sees a code, it’s valid only for a short period. While truncation makes the output small, because the underlying space of possible HMAC outputs is enormous, guessing the code is practically impossible.
This layered approach means attackers can’t simply guess or compute your codes without also having your secret key.
TOTP is a special case of a more general system called HMAC-based OTP. It uses a counter that increases each time you request a code, rather than using time. TOTP also replaces the counter with the current time slice, which makes it more convenient because both sides stay in-sync automatically.
Other systems use different approaches. For example, push-based 2FA apps send you a notification to approve. Hardware tokens such as YubiKeys generate codes directly on a physical device. But all share the same principle: adding a second factor beyond your password.
Say your secret key is “DRAGON” (in reality, it’d be a random string of bytes) and the current time counter is 10,00,000. Compute HMAC-SHA-256 of the secret and the counter. This yields a 256-bit result, like 4a3b7f2c… (64 hexadecimal characters). Use the last few bits to choose an offset, then take four bytes starting there. Convert those bytes into a number, which is say 123456789. Divide 12,34,56,789 by 1,000,000 and take the remainder: 4,56,789. Thus your six-digit OTP is 456789.
At the same moment, the server does the same steps and gets the same result. If your input matches, you are authenticated.
