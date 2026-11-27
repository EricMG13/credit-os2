# MSAL pin for Entra sign-in

Use `msal==1.39.0` for the tenant-specific public-client authorization-code flow required by the sign-in spec. This release supports Python 3.13 and uses the MIT license. The application will use MSAL for PKCE, state and nonce handling. The plan authorizes this single new direct dependency. [MSAL 1.39.0 release](https://pypi.org/project/msal/1.39.0/)

The lock adds `cffi==2.1.1`, `charset-normalizer==3.5.3`, `cryptography==50.0.2`, `pycparser==3.12`, `PyJWT==2.15.1`, `requests==2.34.2` and `urllib3==2.8.0`. The existing versions of `certifi` and `idna` also satisfy this graph. The work-PC change pack can read these pins and their hashes from `uv.lock`.

Proof for this slice uses a loopback stand-in with process-generated signing keys. Package acquisition is separate from the offline build and test runs. Work-PC Entra registration and real sign-in remain separate proof.

In the loopback proof, MSAL needed an HTTPS authority string. The injected client mapped only the declared authority to the local HTTP stand-in. With the same header and claims, MSAL accepted the token whose signature bytes changed. The valid control's signature verified independently. The application factory discards cache entries because MSAL's default DEBUG cache event includes the authorization code and PKCE verifier. The accepted proof captured DEBUG with the application factory and found no credential values.

Not verified: installation and sign-in on the Windows work PC or authentication against a real Entra tenant.
