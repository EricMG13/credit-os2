# Trial bundle case1-cp3-cp6-cp5

- live/calls.jsonl: `request_id` values replaced with `[stripped]` after copying; the sha256 below is of the stripped file, not the original.
- Excluded from this copy: `inputs/TDG market quotes 2024-09-30.md` (Bloomberg vendor data, not a public filing). `workflow.json` still pins its sha256 and `context.json` still carries its quote values, so the run cannot be replayed byte-for-byte without it.
Staged 2026-11-25T18:27:33Z from a read-only copy. Nothing in the original run folder was modified.

- Original run folder: `~/cos-live/tdg-subset-sol/run`
- Run id: `tdg-2024-09-30-deep_credit_assessment-copilot-sol-medium`
- Issuer: TransDigm Group Incorporated (tdg)
- As-of: 2024-09-30
- Pathway: deep_credit_assessment
- Method version: deploy-v-r14
- Configuration: see live/calls.jsonl (config_id/model/effort) and the case note in the report
- Code revision: not recorded in the run folder
- Accepted modules (events.jsonl order): CP-0, CP-1, CP-1A, CP-1B, CP-DR, CP-1C, CP-1D, CP-2, CP-4, CP-2A, CP-2E, CP-2D, CP-2G, CP-2H, CP-3D, CP-3C, CP-4C, CP-3, CP-5, CP-6

| bundle path | sha256 | bytes | original path |
|---|---|---|---|
| workflow.json | ae86f21f4d4e15a2f9780fce34583ae705c65d73f6de72bad23c85b039f0afdf | 32416 | ~/cos-live/tdg-subset-sol/run/workflow.json |
| identity.json | 5c41d99fdc6856ba0e2b2827a630386b70b5778e38f6e7586a860aee36c43cf9 | 669 | ~/cos-live/tdg-subset-sol/run/identity.json |
| events.jsonl | b9e5c6fd670ddb957f0965292ca424f3a6d17c1212ad82e09f97fa941bb50354 | 14036 | ~/cos-live/tdg-subset-sol/run/events.jsonl |
| live/calls.jsonl | e20107fc4708b27725868f8a6295724ba9e00327e575c95c0cff655ed86fb100 | 80274 | ~/cos-live/tdg-subset-sol/run/live/calls.jsonl |
| instructions/CP-0.md | 9f70242ecf16a2196979c503634a9b8f7376fd9a13f3914bae58e5ac0f62ecce | 75423 | ~/cos-live/tdg-subset-sol/run/instructions/CP-0.md |
| instructions/CP-1.md | eca466cc7e3e7c4a3a8b46fc7a6844e640695641aad2869d260e1786e245c774 | 59165 | ~/cos-live/tdg-subset-sol/run/instructions/CP-1.md |
| instructions/CP-1A.md | f099a73b93e6f72492d350be27a2603f685d9e22dacb5bbb80611ef06a0cef6c | 105099 | ~/cos-live/tdg-subset-sol/run/instructions/CP-1A.md |
| instructions/CP-1B.md | 26bee26fb65f049843c7257b04d99e10031233a857ddd03fe55550fbcdbf6728 | 67090 | ~/cos-live/tdg-subset-sol/run/instructions/CP-1B.md |
| instructions/CP-1C.md | 2bc823b423e343f6f4edb97bbe4050cb6704e2fdd465609bed1202dafc54a9eb | 68496 | ~/cos-live/tdg-subset-sol/run/instructions/CP-1C.md |
| instructions/CP-1D.md | 97c98beb3097339765a59f3b31dfcdd5ffa9711509e175a290bb1476f2117913 | 45459 | ~/cos-live/tdg-subset-sol/run/instructions/CP-1D.md |
| instructions/CP-2.md | f964c056d6b3e10433109296488e20dca6314ed071642529f06fa75c67ea817f | 73183 | ~/cos-live/tdg-subset-sol/run/instructions/CP-2.md |
| instructions/CP-2A.md | 797c45d72301e11bd0455e8735d15ad00638c40d577346121b91618e6dcaee18 | 104342 | ~/cos-live/tdg-subset-sol/run/instructions/CP-2A.md |
| instructions/CP-2D.md | da54e0843f3df2294d29c9efd4f61495af525d8d7b12c31eeb555122d720912e | 66474 | ~/cos-live/tdg-subset-sol/run/instructions/CP-2D.md |
| instructions/CP-2E.md | 8cb37562bfab5cc3332872ed2b1f2755b1d40fdceb711346a977d3b1aee73369 | 97721 | ~/cos-live/tdg-subset-sol/run/instructions/CP-2E.md |
| instructions/CP-2G.md | 241dbe2324b90922ac718f32af22a707317e6c80931b20f37d7f364908e9d586 | 62298 | ~/cos-live/tdg-subset-sol/run/instructions/CP-2G.md |
| instructions/CP-2H.md | 1855d954c6c043a889a90eabc44264c70717ae6a2ffc188ba0df31ed0ee541f7 | 53518 | ~/cos-live/tdg-subset-sol/run/instructions/CP-2H.md |
| instructions/CP-3.md | bb7fc7fb631eaae85deecd41b2a212b89f7ad4acb185fe7ff172e210fc36c562 | 188850 | ~/cos-live/tdg-subset-sol/run/instructions/CP-3.md |
| instructions/CP-3C.md | ad67b40c02e8140fbabe91938ca6db77f22761b150184e497cfcc7cb92f0b377 | 79225 | ~/cos-live/tdg-subset-sol/run/instructions/CP-3C.md |
| instructions/CP-3D.md | 0cffdde8a93bbb1b6e90bcb2326da237e8006bd37cddc6422e8f579035210d5b | 47243 | ~/cos-live/tdg-subset-sol/run/instructions/CP-3D.md |
| instructions/CP-4.md | 64e7ecbef649f55ba17ca06f1e735337a6ab26801e2fdef7ec6c952fed8f3b4b | 217948 | ~/cos-live/tdg-subset-sol/run/instructions/CP-4.md |
| instructions/CP-4C.md | 8937076ec229a54dff6fcab505eb069ec5ba651b0904a47a4b00c2406a753570 | 57388 | ~/cos-live/tdg-subset-sol/run/instructions/CP-4C.md |
| instructions/CP-5.md | 5200ab3314d5e0ed96e2b98f65bddfee5458ee3ba1aca4932eca662ef3f53ca4 | 127297 | ~/cos-live/tdg-subset-sol/run/instructions/CP-5.md |
| instructions/CP-6.md | 2e667b631af5b4b4f4e38849c64aa2d35c75e05a35a43d9967a04c079509623e | 142349 | ~/cos-live/tdg-subset-sol/run/instructions/CP-6.md |
| instructions/CP-DR.md | 5eac3c3028cbaf72fee67a2d0ffd20abf311a6f3c3e49bbd792514ad8750557b | 73611 | ~/cos-live/tdg-subset-sol/run/instructions/CP-DR.md |
| handoffs/CP-0.md | 262ee9b6359f01ad87862a2aaca55dacd91a2a1ecad55ecaacfe906f6aa300b4 | 30705 | ~/cos-live/tdg-subset-sol/run/requests/CP-0/3a10a7ed01411e0d518a12cefcb810f4a65febc300fb1afdaf943c9617a56c3b/1.response.md |
| reviews/CP-0.review.json | e7f7788fdbc3b9d076f27352ff78d94fbfab012a0e8f375f5d17fa66b7baf308 | 107 | ~/cos-live/tdg-subset-sol/run/requests/CP-0/3a10a7ed01411e0d518a12cefcb810f4a65febc300fb1afdaf943c9617a56c3b/1.review.json |
| method-checks/CP-0.method-checks.json | fa970791943aa9fe1b9ec5e5f95bc1f9755bfc814d930056db6657d7452d56ad | 6896 | ~/cos-live/tdg-subset-sol/run/requests/CP-0/3a10a7ed01411e0d518a12cefcb810f4a65febc300fb1afdaf943c9617a56c3b/1.method-checks.json |
| handoffs/CP-1.md | 0ddfc6deafdac91bcd221fd126e48b48528caf7259b66a6346b94dc5e5b579d2 | 81314 | ~/cos-live/tdg-subset-sol/run/requests/CP-1/7d1a64f45286abae2893a40e59c7bc96bd21c4f002254802d6fbc9dfb9998cfc/1.response.md |
| reviews/CP-1.review.json | 03e1dc207f3fa0a13c2c82af6fcb301e4558a125a18ee4ed33e2ba807d0a9b24 | 107 | ~/cos-live/tdg-subset-sol/run/requests/CP-1/7d1a64f45286abae2893a40e59c7bc96bd21c4f002254802d6fbc9dfb9998cfc/1.review.json |
| method-checks/CP-1.method-checks.json | 007779f8518be1fe44d49e8eb927a6856030398bffd00cc64e4bd825cde51d60 | 6674 | ~/cos-live/tdg-subset-sol/run/requests/CP-1/7d1a64f45286abae2893a40e59c7bc96bd21c4f002254802d6fbc9dfb9998cfc/1.method-checks.json |
| handoffs/CP-1A.md | 2f3c90f18106b61950e930aa90e2300a5c58add4d206077bca3ca4a743f8f0ae | 60822 | ~/cos-live/tdg-subset-sol/run/requests/CP-1A/9b390f6b4ac223e8392e831cc4846d98c6c1fc3e0cf7781bbf3683cc3801126e/1.response.md |
| reviews/CP-1A.review.json | 3ba61ec50b0c45782f56b29176877db06a1a2af2fc229061ae8231c156729b3c | 107 | ~/cos-live/tdg-subset-sol/run/requests/CP-1A/9b390f6b4ac223e8392e831cc4846d98c6c1fc3e0cf7781bbf3683cc3801126e/1.review.json |
| method-checks/CP-1A.method-checks.json | a084fe16150b94e7410f0d7544238be8a84eb27bf49af2329f9edfee6dd1963e | 9541 | ~/cos-live/tdg-subset-sol/run/requests/CP-1A/9b390f6b4ac223e8392e831cc4846d98c6c1fc3e0cf7781bbf3683cc3801126e/1.method-checks.json |
| handoffs/CP-1B.md | e3175edcf65b268e228c0502ff93387b0d5a591e6162923e4ad094828b232f33 | 51578 | ~/cos-live/tdg-subset-sol/run/requests/CP-1B/a6ac8581909f5e7b3fe76f4e3d88d9b5a23a2a4f91e4b520ac29fd8109255b8d/1.response.md |
| reviews/CP-1B.review.json | 1f84d74301774f07313b8fa47d5062111b95322673743e21e3b0176ab6eb4378 | 107 | ~/cos-live/tdg-subset-sol/run/requests/CP-1B/a6ac8581909f5e7b3fe76f4e3d88d9b5a23a2a4f91e4b520ac29fd8109255b8d/1.review.json |
| method-checks/CP-1B.method-checks.json | 8ab766551b8ecae9aa158859fdbde2adae4b6065b6a8248feaebede771e39b11 | 27505 | ~/cos-live/tdg-subset-sol/run/requests/CP-1B/a6ac8581909f5e7b3fe76f4e3d88d9b5a23a2a4f91e4b520ac29fd8109255b8d/1.method-checks.json |
| handoffs/CP-DR.md | f7ebcff4948d7c1303dbe93be2415859b4244722e9b3b4d14d0e2b18c8488d80 | 34491 | ~/cos-live/tdg-subset-sol/run/requests/CP-DR/6799fcf4c3f2039ac057f3735364bfb885b12283cdc27abc0651aef2417b63da/1.response.md |
| reviews/CP-DR.review.json | 2d12e9a033086b8307d087d9a74ea11cccd0a000f411b64ab42cbb5205b1f078 | 107 | ~/cos-live/tdg-subset-sol/run/requests/CP-DR/6799fcf4c3f2039ac057f3735364bfb885b12283cdc27abc0651aef2417b63da/1.review.json |
| method-checks/CP-DR.method-checks.json | 71fdf1ee4ce4fa62e7d0965a75053366ecef36a80036ea94e43654e3e706652c | 2744 | ~/cos-live/tdg-subset-sol/run/requests/CP-DR/6799fcf4c3f2039ac057f3735364bfb885b12283cdc27abc0651aef2417b63da/1.method-checks.json |
| handoffs/CP-1C.md | d73a84ee1c7705d5acae8b7cf0aff748c3c5e1597ebe5f84f541883adc03b025 | 19920 | ~/cos-live/tdg-subset-sol/run/requests/CP-1C/fc22b3753a70fde21a4eb3c6b212755d40443d9586c463218dbc7dccc046b7c9/1.response.md |
| reviews/CP-1C.review.json | 191d46998a9e484046cc8dcaaac32fdfc5938e47a1d8e26f0a061021be4278b1 | 107 | ~/cos-live/tdg-subset-sol/run/requests/CP-1C/fc22b3753a70fde21a4eb3c6b212755d40443d9586c463218dbc7dccc046b7c9/1.review.json |
| method-checks/CP-1C.method-checks.json | de01ffaf91b53131dfd123ce2d2ef7f9c37abba232c5102114e0cd7b261bf44b | 23131 | ~/cos-live/tdg-subset-sol/run/requests/CP-1C/fc22b3753a70fde21a4eb3c6b212755d40443d9586c463218dbc7dccc046b7c9/1.method-checks.json |
| handoffs/CP-1D.md | 78f414859ee0217f72a3ea4473c475ed0d26ca45c90c724f36f58ba7e66c8e9d | 41570 | ~/cos-live/tdg-subset-sol/run/requests/CP-1D/843d779af8f0860ac954cacfb2b5513c7a1d58e2a22a7b8ebd9629e8e53bd6cc/1.response.md |
| reviews/CP-1D.review.json | f8d7d66b19bf1ed8f291d985d19f9eb73871ac8c7481b700d687be43c500d79e | 107 | ~/cos-live/tdg-subset-sol/run/requests/CP-1D/843d779af8f0860ac954cacfb2b5513c7a1d58e2a22a7b8ebd9629e8e53bd6cc/1.review.json |
| method-checks/CP-1D.method-checks.json | 6ce793f661f7551a54c46ece9ecf36c029b84250b95a93064b9e05eac56458fd | 5488 | ~/cos-live/tdg-subset-sol/run/requests/CP-1D/843d779af8f0860ac954cacfb2b5513c7a1d58e2a22a7b8ebd9629e8e53bd6cc/1.method-checks.json |
| handoffs/CP-2.md | dc6a0459731eea84ec87f7b8b2d09415c03e11a24bebb7dca2fda0edbe63dccf | 48005 | ~/cos-live/tdg-subset-sol/run/requests/CP-2/f5f1f0ae2d3b84ffa3aa8b90cffc71781eb6e93587a22a865eb855e4c10c47d7/1.response.md |
| reviews/CP-2.review.json | f5646ab65f94f9b1d204a8454e13d4cfdbb0a74b5420dd994cdf6c672c8a84d8 | 107 | ~/cos-live/tdg-subset-sol/run/requests/CP-2/f5f1f0ae2d3b84ffa3aa8b90cffc71781eb6e93587a22a865eb855e4c10c47d7/1.review.json |
| method-checks/CP-2.method-checks.json | db183ead1a3377f9e9cf440e9213dbf5a40edb54594236bfa2676df8e3364792 | 2358 | ~/cos-live/tdg-subset-sol/run/requests/CP-2/f5f1f0ae2d3b84ffa3aa8b90cffc71781eb6e93587a22a865eb855e4c10c47d7/1.method-checks.json |
| handoffs/CP-4.md | 5b0d7ce182c769f94a96740891ab58a71ac56ecbc2782b8b259b883d84868795 | 83663 | ~/cos-live/tdg-subset-sol/run/requests/CP-4/b2b2cb9ef3b0e357309f0e6caa44e8c080316ee188465b32637f4d3e57fab74a/1.response.md |
| reviews/CP-4.review.json | 59d14c0cb6991218f4f5b686c24b332ae90c088ac50ba26ed59d54209bcdbd33 | 107 | ~/cos-live/tdg-subset-sol/run/requests/CP-4/b2b2cb9ef3b0e357309f0e6caa44e8c080316ee188465b32637f4d3e57fab74a/1.review.json |
| method-checks/CP-4.method-checks.json | 3c149fe081cd9a7b1ca0749897cd41f9a7479fad7cd02ee58828ceea9872ce07 | 23631 | ~/cos-live/tdg-subset-sol/run/requests/CP-4/b2b2cb9ef3b0e357309f0e6caa44e8c080316ee188465b32637f4d3e57fab74a/1.method-checks.json |
| handoffs/CP-2A.md | bfaaee27ecb51c2614443c05eb3fa473177b9a85721d3cd82da81274258c1ff6 | 33641 | ~/cos-live/tdg-subset-sol/run/requests/CP-2A/88d79b7ca796fdec0ce6d51544bd3d72500fd9f1d67362e98dc20ad3b9421316/1.response.md |
| reviews/CP-2A.review.json | 9fa55431f6d889caa6ba553fa4c73d2a75c07c60c125741e0fa0cfc4d11d49ba | 107 | ~/cos-live/tdg-subset-sol/run/requests/CP-2A/88d79b7ca796fdec0ce6d51544bd3d72500fd9f1d67362e98dc20ad3b9421316/1.review.json |
| method-checks/CP-2A.method-checks.json | 076c7f9fa513326eea8dd594aea714c285809980ce17776cc4b25954fff5e7e3 | 6923 | ~/cos-live/tdg-subset-sol/run/requests/CP-2A/88d79b7ca796fdec0ce6d51544bd3d72500fd9f1d67362e98dc20ad3b9421316/1.method-checks.json |
| handoffs/CP-2E.md | 07fc638c1461ff2144da31f25ac8824dc06bb001433c5122f5b06f1ba3bc8647 | 47366 | ~/cos-live/tdg-subset-sol/run/requests/CP-2E/1836071320c903ee8ac1417dae70f41425bdc4dbf753f5d8be21784902f3edd9/1.response.md |
| reviews/CP-2E.review.json | d3ca0adf2c3e59eea7d4651e0d12f36cfe4711740a36ca9802e556c58dd5115d | 107 | ~/cos-live/tdg-subset-sol/run/requests/CP-2E/1836071320c903ee8ac1417dae70f41425bdc4dbf753f5d8be21784902f3edd9/1.review.json |
| method-checks/CP-2E.method-checks.json | 2115b5f13cdc352028b615263f7fc80f61098ea5b59435defad556087b03a963 | 8827 | ~/cos-live/tdg-subset-sol/run/requests/CP-2E/1836071320c903ee8ac1417dae70f41425bdc4dbf753f5d8be21784902f3edd9/1.method-checks.json |
| handoffs/CP-2D.md | 36b7097ae8d40b105d0c925a48d734ce4879a1198d801ec33c5f422638f21230 | 37413 | ~/cos-live/tdg-subset-sol/run/requests/CP-2D/6ecf488962e6312f05a1a62fb3260168d944621ed37188f430723385cc94f6c5/1.response.md |
| reviews/CP-2D.review.json | 68a19381b7e87eea72d6fcfe22bb1302b0158f8e0dd2b8bb7cfaaf66fc5ceef0 | 107 | ~/cos-live/tdg-subset-sol/run/requests/CP-2D/6ecf488962e6312f05a1a62fb3260168d944621ed37188f430723385cc94f6c5/1.review.json |
| method-checks/CP-2D.method-checks.json | 74269bf332f4dbdc39abdd78880d6789867d965ba05912f1d8debf8c9fe1c86f | 5138 | ~/cos-live/tdg-subset-sol/run/requests/CP-2D/6ecf488962e6312f05a1a62fb3260168d944621ed37188f430723385cc94f6c5/1.method-checks.json |
| handoffs/CP-2G.md | cb978ebb8e85145a4838f0c57d3b3b36c7b65ec77bcde4d94284486e870846d6 | 36941 | ~/cos-live/tdg-subset-sol/run/requests/CP-2G/f4f83409a2239ef59994b255225172ce91129290e75ad5da65277f308f6500c7/1.response.md |
| reviews/CP-2G.review.json | 71f9642ddac57519310413de3ef2298b82b4b51bf6b88ea1a4a5143fa6deb805 | 107 | ~/cos-live/tdg-subset-sol/run/requests/CP-2G/f4f83409a2239ef59994b255225172ce91129290e75ad5da65277f308f6500c7/1.review.json |
| method-checks/CP-2G.method-checks.json | 330e36cb624c8bd600f3abcd06f18853285256dcc546136affe708f9a6ea1967 | 4593 | ~/cos-live/tdg-subset-sol/run/requests/CP-2G/f4f83409a2239ef59994b255225172ce91129290e75ad5da65277f308f6500c7/1.method-checks.json |
| handoffs/CP-2H.md | b29ed4847771db5d782bbd51e0fcda83589cb49875ee4ccbf3b5a61f036b1719 | 27769 | ~/cos-live/tdg-subset-sol/run/requests/CP-2H/79e0294f831e2d35103f797ba74f8cabfea4fbcfcbce86396e0c08c45dd88e6f/1.response.md |
| reviews/CP-2H.review.json | d81dc3c2411e4a5d9e65aacae91111fef58a5ecfbacdce0595e56d74e02410b2 | 107 | ~/cos-live/tdg-subset-sol/run/requests/CP-2H/79e0294f831e2d35103f797ba74f8cabfea4fbcfcbce86396e0c08c45dd88e6f/1.review.json |
| method-checks/CP-2H.method-checks.json | cfce7d29a1b82c1394fc231579c3cee0b074dabac0ed5f57c7aa61470ff989e9 | 7011 | ~/cos-live/tdg-subset-sol/run/requests/CP-2H/79e0294f831e2d35103f797ba74f8cabfea4fbcfcbce86396e0c08c45dd88e6f/1.method-checks.json |
| handoffs/CP-3D.md | 2ed704ce4c9b8fca19a5f153d80425a4eeebaa348a6e168c9d1140a51554c1cd | 33504 | ~/cos-live/tdg-subset-sol/run/requests/CP-3D/d71c212628030f0fd0bf36885762aec0a7620260c97e90bf073d96833243c79f/1.response.md |
| reviews/CP-3D.review.json | 6f69a5af92bd3d3c6a3ff41b4452b7563b1ad34269a5b9dd9c28ed28597d2317 | 107 | ~/cos-live/tdg-subset-sol/run/requests/CP-3D/d71c212628030f0fd0bf36885762aec0a7620260c97e90bf073d96833243c79f/1.review.json |
| method-checks/CP-3D.method-checks.json | 4d11f26315d17ddb8619bf23ecf1dc7e335985a262cbf4545ce3bbba670509e0 | 753 | ~/cos-live/tdg-subset-sol/run/requests/CP-3D/d71c212628030f0fd0bf36885762aec0a7620260c97e90bf073d96833243c79f/1.method-checks.json |
| handoffs/CP-3C.md | fd37ef12ef5bd46beea7235e1b19ebd0d388138cb4f63a44d208b4a6fff5ae1e | 64064 | ~/cos-live/tdg-subset-sol/run/requests/CP-3C/3affe905fe423f78181407c19c4de8ffe9dd11f7a7c4ac638d73b02d15660743/1.response.md |
| reviews/CP-3C.review.json | 93b5118752f337aa8774e1c03e85cb52e547e575fa57eb4730678d8fed4bc16e | 107 | ~/cos-live/tdg-subset-sol/run/requests/CP-3C/3affe905fe423f78181407c19c4de8ffe9dd11f7a7c4ac638d73b02d15660743/1.review.json |
| method-checks/CP-3C.method-checks.json | ab3deb31846d9b43e5ce0d001db5ff3a43335e01d046a0291f38d4b426db3b42 | 9505 | ~/cos-live/tdg-subset-sol/run/requests/CP-3C/3affe905fe423f78181407c19c4de8ffe9dd11f7a7c4ac638d73b02d15660743/1.method-checks.json |
| handoffs/CP-4C.md | 0331377e7e40d65553dce01efc9adc916d37190dd7878559606c9e9c1eed47f8 | 23424 | ~/cos-live/tdg-subset-sol/run/requests/CP-4C/ffe2826020b81769d3dc5d184d23b9e33de2d7d5b07d10f054b8cc72e9411a4e/1.response.md |
| reviews/CP-4C.review.json | 7967092d794031801d0326da9b74a8691614fdf05abead5a00db2ade812693c4 | 107 | ~/cos-live/tdg-subset-sol/run/requests/CP-4C/ffe2826020b81769d3dc5d184d23b9e33de2d7d5b07d10f054b8cc72e9411a4e/1.review.json |
| method-checks/CP-4C.method-checks.json | 2c612c0eeb726ccb061bf5b0ed3dff7276af21bde3541195d77096c593a3f403 | 5884 | ~/cos-live/tdg-subset-sol/run/requests/CP-4C/ffe2826020b81769d3dc5d184d23b9e33de2d7d5b07d10f054b8cc72e9411a4e/1.method-checks.json |
| handoffs/CP-3.md | c4f7926ca861f1605b74a442853b15d09a9fbb4e5fb49389e26ac32363f13683 | 55293 | ~/cos-live/tdg-subset-sol/run/requests/CP-3/c3f17ad1c2b9f3ba90ae8b015cd7e3dde520c8b455216a8e31909fec1d61922a/1.response.md |
| reviews/CP-3.review.json | 063c8e71fb980c11b6adc20a8a062565789728ad84fb5dce1bde9ef5c4df6506 | 107 | ~/cos-live/tdg-subset-sol/run/requests/CP-3/c3f17ad1c2b9f3ba90ae8b015cd7e3dde520c8b455216a8e31909fec1d61922a/1.review.json |
| method-checks/CP-3.method-checks.json | 4bac7367b00566dcc6cfc51aa21d50d305a3776ca63e68e8cdda21f9768200bc | 12207 | ~/cos-live/tdg-subset-sol/run/requests/CP-3/c3f17ad1c2b9f3ba90ae8b015cd7e3dde520c8b455216a8e31909fec1d61922a/1.method-checks.json |
| handoffs/CP-5.md | 43a8fcda770e0fe69a5796390b9e0eba4fc3a8ecda404e7377c304aea40aef85 | 43815 | ~/cos-live/tdg-subset-sol/run/requests/CP-5/61ac63f5753ededf30f74cd76e6657c718a160aa683bd9ccfb862f3fd0e9c3fb/1.response.md |
| reviews/CP-5.review.json | 0cb434f22bc8b72d85127fefc7d4246285911e7e706a21f9482c60ba3d349a22 | 107 | ~/cos-live/tdg-subset-sol/run/requests/CP-5/61ac63f5753ededf30f74cd76e6657c718a160aa683bd9ccfb862f3fd0e9c3fb/1.review.json |
| method-checks/CP-5.method-checks.json | 3e15ddaba0353d8bd546144affb9c8dbc866e23c1ca92c57badc57bdc66927df | 7909 | ~/cos-live/tdg-subset-sol/run/requests/CP-5/61ac63f5753ededf30f74cd76e6657c718a160aa683bd9ccfb862f3fd0e9c3fb/1.method-checks.json |
| handoffs/CP-6.md | 0eaa352132d1be3aea6272375eeb1af5acb82455b0d7cd0e55f5bc01e67154ff | 63439 | ~/cos-live/tdg-subset-sol/run/requests/CP-6/5884eda10ff048a1afcf44565c49d803185c41618ffffe28d1f827793acbbbd4/1.response.md |
| reviews/CP-6.review.json | 5dc9a30db88ed2dd4feb987043754e6d6bafb45afa0f663a3f727d1ac7ee38be | 107 | ~/cos-live/tdg-subset-sol/run/requests/CP-6/5884eda10ff048a1afcf44565c49d803185c41618ffffe28d1f827793acbbbd4/1.review.json |
| method-checks/CP-6.method-checks.json | 6bf9e533f40a5cbf6f111d15e3ef081029a08abed93c5e2eae43c5ef56729d79 | 4947 | ~/cos-live/tdg-subset-sol/run/requests/CP-6/5884eda10ff048a1afcf44565c49d803185c41618ffffe28d1f827793acbbbd4/1.method-checks.json |
| inputs/TDG_2024-03-30_10-Q_0001260221-24-000046_tdg-20240330.htm.jsonl | fcec3566cfda08c82a8aaed7289c6440cc05d12976f237cd72a32cf9fbfb2ed6 | 192510 | ~/cos-live/tdg-subset-sol/run/inputs/fcec3566cfda08c82a8aaed7289c6440cc05d12976f237cd72a32cf9fbfb2ed6 |
| inputs/TDG_2024-06-29_10-Q_0001260221-24-000069_tdg-20240629.htm.jsonl | ce1b0541d5e8222dc536d748942a3cb51236d7ff62d8613b002460bd8b41dcf2 | 206214 | ~/cos-live/tdg-subset-sol/run/inputs/ce1b0541d5e8222dc536d748942a3cb51236d7ff62d8613b002460bd8b41dcf2 |
| inputs/TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl | d75c469fdb1966dd895c0f6faa6d5179b380d3ed95aa00aca99aa258059edab6 | 504860 | ~/cos-live/tdg-subset-sol/run/inputs/d75c469fdb1966dd895c0f6faa6d5179b380d3ed95aa00aca99aa258059edab6 |
| inputs/TDG_2024-12-28_10-Q_0001260221-25-000014_tdg-20241228.htm.jsonl | ec98b47e6ebad9663286dc04b35dade04d11e7d12c3642ddaa6ef549a33d671f | 150291 | ~/cos-live/tdg-subset-sol/run/inputs/ec98b47e6ebad9663286dc04b35dade04d11e7d12c3642ddaa6ef549a33d671f |
| inputs/TDG_FY2024_annual-report_SEC-PDF_0001260221-25-000008_a841225transd-9b8b215f.pdf | dc6a8ea6249e4e919d190a4bbb459d9bf4eded005b7d5680ae911b32d44d44af | 4378190 | ~/cos-live/tdg-subset-sol/run/inputs/dc6a8ea6249e4e919d190a4bbb459d9bf4eded005b7d5680ae911b32d44d44af |
| context.json | afa1c047284df61354eac1185cd590baf2a9f2b4fc8386002e57ddbe15927657 | 3259 | ~/cos-live/tdg-subset-sol/run/inputs/afa1c047284df61354eac1185cd590baf2a9f2b4fc8386002e57ddbe15927657 |
