"use strict";
(() => {
const STUBX_LAB = {"mission":{"id":"mision-01","version":"1.0.0","updated":"2026-10-09","cardDate":"2026-10-08","title":{"es":"Cómo detectar un token clon en 5 comprobaciones","en":"How to spot a clone token in 5 checks"},"intro":{"es":"Vas a leer fichas reales de STUBX Verify del 2026-10-08. No es una consulta en directo. Una respuesta que no encaja se explica y se puede volver a intentar. No hay penalización. El progreso se guarda solo en este navegador, se puede borrar y no es un certificado.","en":"You will read real STUBX Verify cards from 2026-10-08. This is not a live query. An answer that does not fit is explained, and you can try again. There is no penalty. Progress is stored only in this browser, it can be deleted, and it is not a certificate."},"closing":{"es":"El progreso queda en este navegador. Se puede borrar o editar y no sale del dispositivo por esta página. No es un certificado ni hace falta una cuenta, una cartera o tener STUBX para leer la misión.","en":"Progress stays in this browser. It can be deleted or edited, and this page does not send it off the device. It is not a certificate. No account is required, nothing is signed, and holding STUBX is not required to read the mission."},"steps":[{"id":"direccion","kind":"check","glossary":["direccion","registro","suplantacion"],"cards":["TNWwnzecb37272ZoySDE6D2UcmqNnU12EqtycNSpump","DjEjb6bxQ3Hjej9CzUAVeRqyt7k1tevHgcS37t41PUhQ","Hhq4ffySVX3UQqSowjhP1Lwa8YuJDf7iH2hYWvVHTuEf"],"fields":["name","mint","inRegistry","statement"],"prompt":{"es":"Tres fichas del 2026-10-08 muestran nombres parecidos. ¿Cuál es la dirección del mint que está en el registro curado?","en":"Three cards from 2026-10-08 show similar names. Which address is the mint that is in the curated registry?"},"guide":{"es":"El nombre se puede repetir. La dirección del mint es el dato que hay que comparar con el registro.","en":"A name can be reused. The mint address is the fact to compare with the registry."},"options":[{"id":"oficial","label":{"es":"TNWwnzecb37272ZoySDE6D2UcmqNnU12EqtycNSpump","en":"TNWwnzecb37272ZoySDE6D2UcmqNnU12EqtycNSpump"},"mint":"TNWwnzecb37272ZoySDE6D2UcmqNnU12EqtycNSpump"},{"id":"clon-dj","label":{"es":"DjEjb6bxQ3Hjej9CzUAVeRqyt7k1tevHgcS37t41PUhQ","en":"DjEjb6bxQ3Hjej9CzUAVeRqyt7k1tevHgcS37t41PUhQ"},"mint":"DjEjb6bxQ3Hjej9CzUAVeRqyt7k1tevHgcS37t41PUhQ"},{"id":"clon-hh","label":{"es":"Hhq4ffySVX3UQqSowjhP1Lwa8YuJDf7iH2hYWvVHTuEf","en":"Hhq4ffySVX3UQqSowjhP1Lwa8YuJDf7iH2hYWvVHTuEf"},"mint":"Hhq4ffySVX3UQqSowjhP1Lwa8YuJDf7iH2hYWvVHTuEf"}],"correct":"oficial","whyRight":{"es":"En la ficha del 2026-10-08, solo TNWwnzecb37272ZoySDE6D2UcmqNnU12EqtycNSpump figura en el registro curado. Los otros dos nombres incluyen STUBX y sus direcciones son otras. Esa coincidencia es una señal de posible suplantación y no atribuye intención.","en":"On the 2026-10-08 card, only TNWwnzecb37272ZoySDE6D2UcmqNnU12EqtycNSpump is in the curated registry. The other two names include STUBX and their addresses are different. That match is a possible-impersonation signal and does not attribute intent."},"whyWrong":{"clon-dj":{"es":"DjEjb6bxQ3Hjej9CzUAVeRqyt7k1tevHgcS37t41PUhQ se llama Comunidad STUBX, pero la ficha dice que no está en el registro. El nombre no sustituye a la dirección.","en":"DjEjb6bxQ3Hjej9CzUAVeRqyt7k1tevHgcS37t41PUhQ is named Comunidad STUBX, but the card says it is not in the registry. The name does not stand in for the address."},"clon-hh":{"es":"Hhq4ffySVX3UQqSowjhP1Lwa8YuJDf7iH2hYWvVHTuEf se llama Comunidad STUBX · Creador. La ficha marca posible suplantación porque el nombre o un enlace coinciden y el mint es otro.","en":"Hhq4ffySVX3UQqSowjhP1Lwa8YuJDf7iH2hYWvVHTuEf is named Comunidad STUBX · Creador. The card marks possible impersonation because the name or a link matches and the mint is a different one."}}},{"id":"emision","kind":"check","glossary":["autoridad-emision"],"cards":["TNWwnzecb37272ZoySDE6D2UcmqNnU12EqtycNSpump","DjEjb6bxQ3Hjej9CzUAVeRqyt7k1tevHgcS37t41PUhQ","EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"],"fields":["name","mint","mintAuthority"],"prompt":{"es":"El mint DjEjb6bxQ3Hjej9CzUAVeRqyt7k1tevHgcS37t41PUhQ tiene la autoridad de emisión revocada, igual que el mint del registro. ¿Qué se puede afirmar con la ficha?","en":"Mint DjEjb6bxQ3Hjej9CzUAVeRqyt7k1tevHgcS37t41PUhQ has mint authority revoked, the same as the registry mint. What can the card support?"},"guide":{"es":"Revocada significa que ese permiso concreto figura en 0 en esa lectura. No dice qué dirección es la del registro.","en":"Revoked means that specific permission is recorded as 0 in that reading. It does not say which address is the registry mint."},"options":[{"id":"coincide","label":{"es":"Es el mint del registro, porque el permiso coincide.","en":"It is the registry mint, because the permission matches."}},{"id":"solo-permiso","label":{"es":"Ese permiso figura revocado. No identifica el mint ni demuestra que el proyecto sea legítimo.","en":"That permission is recorded as revoked. It does not identify the mint or show that the project is legitimate."}},{"id":"no-leido","label":{"es":"La ficha no pudo leer el permiso y por eso escribe revocada.","en":"The card could not read the permission, so it writes revoked."}}],"correct":"solo-permiso","whyRight":{"es":"En las dos fichas de STUBX y del clon, el estado de la autoridad de emisión es revocada y el estado del campo es verificado. USDC, en la misma tanda, la tiene activa. El permiso no iguala las direcciones.","en":"On both the STUBX card and the clone card, mint authority state is revoked and the field status is verified. USDC, in the same batch, has it active. The permission does not make the addresses the same."},"whyWrong":{"coincide":{"es":"Dos mints distintos pueden tener el mismo permiso. La dirección de DjEjb6bxQ3Hjej9CzUAVeRqyt7k1tevHgcS37t41PUhQ no es la del registro.","en":"Two different mints can have the same permission. The address DjEjb6bxQ3Hjej9CzUAVeRqyt7k1tevHgcS37t41PUhQ is not the registry address."},"no-leido":{"es":"Aquí el campo está verificado, no en no disponible. Si no se hubiera podido leer, la ficha no lo presentaría como revocada.","en":"Here the field is verified, not unavailable. If it could not be read, the card would not present it as revoked."}}},{"id":"congelacion","kind":"check","glossary":["autoridad-congelacion","registro"],"cards":["TNWwnzecb37272ZoySDE6D2UcmqNnU12EqtycNSpump","EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v","Hhq4ffySVX3UQqSowjhP1Lwa8YuJDf7iH2hYWvVHTuEf"],"fields":["name","mint","freezeAuthority","inRegistry","statement"],"prompt":{"es":"USDC tiene la autoridad de congelación activa y no está en el registro de STUBX. ¿Qué lectura encaja con la ficha?","en":"USDC has freeze authority active and is not in the STUBX registry. Which reading fits the card?"},"guide":{"es":"Una autoridad activa es un permiso de ese mint. No estar en el registro de STUBX no convierte a otro token en clon.","en":"An active authority is a permission of that mint. Being outside the STUBX registry does not turn another token into a clone."},"options":[{"id":"es-suplantacion","label":{"es":"USDC es una suplantación de STUBX.","en":"USDC is an impersonation of STUBX."}},{"id":"permiso-y-registro","label":{"es":"La autoridad activa es un permiso de ese mint. No estar en el registro no significa que el token sea falso ni una copia.","en":"The active authority is a permission of that mint. Not being in the registry does not mean the token is false or a copy."}},{"id":"solo-revocada","label":{"es":"Solo un mint con la congelación revocada puede ser auténtico.","en":"Only a mint with freeze authority revoked can be authentic."}}],"correct":"permiso-y-registro","whyRight":{"es":"La ficha de USDC del 2026-10-08 dice que no está en el registro y que eso no significa que sea falso ni una copia. La autoridad de congelación activa queda como un permiso concreto, con estado verificado.","en":"The USDC card from 2026-10-08 says it is not in the registry and that this does not mean it is false or a copy. Active freeze authority remains one specific permission, with verified status."},"whyWrong":{"es-suplantacion":{"es":"La señal de posible suplantación sale cuando el nombre, el símbolo, la imagen o un enlace coinciden con el registro y el mint es otro. La ficha de USDC no marca esa señal.","en":"The possible-impersonation signal appears when the name, symbol, image, or a link matches the registry and the mint is a different one. The USDC card does not mark that signal."},"solo-revocada":{"es":"Que la congelación esté revocada quita ese permiso. No es una prueba de autenticidad. El clon Hhq4ffySVX3UQqSowjhP1Lwa8YuJDf7iH2hYWvVHTuEf también la tiene revocada y no es el mint del registro.","en":"Revoked freeze authority removes that permission. It is not proof of authenticity. Clone Hhq4ffySVX3UQqSowjhP1Lwa8YuJDf7iH2hYWvVHTuEf also has it revoked and is not the registry mint."}}},{"id":"desconocido","kind":"check","glossary":["metadatos-mutables","desconocido"],"cards":["TNWwnzecb37272ZoySDE6D2UcmqNnU12EqtycNSpump","EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"],"fields":["name","mint","metadata","holders"],"prompt":{"es":"En la ficha del mint del registro, los metadatos no son mutables en las fuentes leídas y la muestra de holders está en no disponible. ¿Qué combinación es correcta?","en":"On the registry mint card, metadata is not mutable in the sources that were read, and the holder sample is unavailable. Which combination is right?"},"guide":{"es":"Un campo verificado no rellena otro campo que no se pudo leer. Lo no disponible no pasa a cero ni a comprobado.","en":"A verified field does not fill in another field that could not be read. Unavailable does not become zero or verified."},"options":[{"id":"prueba-y-cero","label":{"es":"Los metadatos no mutables demuestran que es el oficial, y la muestra ausente cuenta como concentración cero.","en":"Immutable metadata proves it is the official mint, and the missing sample counts as zero concentration."}},{"id":"sigue-desconocido","label":{"es":"Lo no mutable es lo leído en esa fecha. Lo no disponible sigue desconocido: no pasa a comprobado ni a cero.","en":"Not mutable describes what was read on that date. Unavailable stays unknown: it does not become verified or zero."}},{"id":"anula-ficha","label":{"es":"Si falta la muestra, se anulan los campos que sí figuran como verificados.","en":"If the sample is missing, the fields that are marked verified are cancelled."}}],"correct":"sigue-desconocido","whyRight":{"es":"La ficha es parcial por el HTTP 429 de la muestra de holders. Ese hueco no se interpreta como concentración cero. Los metadatos no mutables en las fuentes leídas tampoco identifican el mint: USDC, en la misma fecha, tiene metadatos mutables y no es un clon.","en":"The card is partial because the holder sample returned HTTP 429. That gap is not read as zero concentration. Metadata that is not mutable in the sources read also does not identify the mint: USDC, on the same date, has mutable metadata and is not a clone."},"whyWrong":{"prueba-y-cero":{"es":"La propia ficha dice que la muestra ausente no es concentración cero. Y unos metadatos no mutables no convierten una dirección en la del registro.","en":"The card itself says the missing sample is not zero concentration. And metadata that is not mutable does not turn an address into the registry mint."},"anula-ficha":{"es":"Parcial significa que falta lo que la ficha nombra, no que el resto deje de constar. Los campos verificados siguen siendo de esa fecha, y el hueco sigue en no disponible.","en":"Partial means the card names something missing. It does not erase the rest. Verified fields remain from that date, and the gap stays unavailable."}}},{"id":"curva","kind":"check","glossary":["suplantacion","curva-pump","reserva-real","reserva-virtual"],"cards":["3Zi6p6wzYZYKyuHdBhsDfb2pRR7XTfTfLKkXL7rwpump","TNWwnzecb37272ZoySDE6D2UcmqNnU12EqtycNSpump"],"fields":["name","mint","impersonation","statement","curvePresent","curveProgress"],"prompt":{"es":"El mint 3Zi6p6wzYZYKyuHdBhsDfb2pRR7XTfTfLKkXL7rwpump tiene avance de curva 0,00 % con estado inferido, y la ficha marca posible suplantación. ¿Qué es exacto?","en":"Mint 3Zi6p6wzYZYKyuHdBhsDfb2pRR7XTfTfLKkXL7rwpump has curve progress 0.00% with inferred status, and the card marks possible impersonation. What is accurate?"},"guide":{"es":"0,00 % inferido no es un dato ausente. La reserva virtual no es la reserva real. La señal de suplantación no atribuye intención.","en":"An inferred 0.00% is not a missing fact. Virtual reserves are not real reserves. The impersonation signal does not attribute intent."},"options":[{"id":"no-leida","label":{"es":"0,00 % significa que no se leyó la curva, y la suplantación prueba la intención de quien creó el token.","en":"0.00% means the curve was not read, and impersonation proves the intent of whoever created the token."}},{"id":"senal-sin-intencion","label":{"es":"0,00 % sale porque la reserva real leída coincide con la inicial documentada. La suplantación es una señal: el nombre o un enlace coinciden y el mint es otro. No atribuye intención.","en":"0.00% appears because the real reserve that was read matches the documented initial reserve. Impersonation is a signal: the name or a link matches and the mint is different. It does not attribute intent."}},{"id":"virtual-retirable","label":{"es":"La reserva virtual es el fondo que se puede retirar.","en":"The virtual reserve is the balance that can be withdrawn."}}],"correct":"senal-sin-intencion","whyRight":{"es":"En los tres clones de la tanda, el avance inferido es 0,00 porque la reserva real coincide con 793100000000000. La cuenta de la curva sí se leyó. En el mint del registro el mismo cálculo sale 1,74, también inferido. La lectura de suplantación de la ficha dice que la coincidencia no atribuye intención.","en":"On the three clones in the batch, inferred progress is 0.00 because the real reserve matches 793100000000000. The curve account was read. On the registry mint the same calculation is 1.74, also inferred. The card's impersonation statement says the match does not attribute intent."},"whyWrong":{"no-leida":{"es":"El estado es inferido, no no disponible. Un dato que no se pudo leer no se rellena con cero. Y la ficha no afirma la intención de nadie.","en":"The status is inferred, not unavailable. A fact that could not be read is not filled in with zero. And the card does not assert anyone's intent."},"virtual-retirable":{"es":"La ficha separa la reserva virtual de la reserva real. La virtual no es el fondo retirable.","en":"The card separates virtual reserves from real reserves. The virtual reserve is not the withdrawable balance."}}},{"id":"caso-nuevo","kind":"comprehension","glossary":["direccion","autoridad-emision","desconocido"],"cards":[],"fields":[],"prompt":{"es":"Caso nuevo, hipotético y rotulado. No es una ficha de Verify y no describe un proyecto real. Nombre mostrado: «STUBX Oficial». Dirección: distinta de TNWwnzecb37272ZoySDE6D2UcmqNnU12EqtycNSpump. Autoridad de emisión: revocada. Muestra de holders: no disponible. Este enunciado no trae curva. ¿Qué haces con esos datos?","en":"New case, hypothetical and labeled as such. It is not a Verify card and it does not describe a real project. Displayed name: “STUBX Oficial”. Address: different from TNWwnzecb37272ZoySDE6D2UcmqNnU12EqtycNSpump. Mint authority: revoked. Holder sample: unavailable. This prompt has no curve. What do you do with those facts?"},"guide":{"es":"Aplica las mismas tres distinciones a un caso que no está en las fichas: dirección frente a nombre, permiso frente a identidad, y desconocido frente a comprobado.","en":"Apply the same three distinctions to a case that is not in the cards: address versus name, permission versus identity, and unknown versus verified."},"options":[{"id":"fiarse-del-nombre","label":{"es":"Trato el nombre «Oficial» como identidad y la muestra no disponible como concentración cero.","en":"I treat the name “Oficial” as identity and the unavailable sample as zero concentration."}},{"id":"comparar-direccion","label":{"es":"Comparo la dirección con el mint del registro. La emisión revocada solo quita ese permiso. «No disponible» no es un dato comprobado.","en":"I compare the address with the registry mint. Revoked mint authority only removes that permission. “Unavailable” is not a verified fact."}},{"id":"revocada-es-registro","label":{"es":"Si la emisión está revocada, la dirección es la del registro aunque sea otra cadena.","en":"If mint authority is revoked, the address is the registry address even if the string is different."}}],"correct":"comparar-direccion","whyRight":{"es":"En un caso distinto de las fichas, el criterio no cambia: la dirección se compara con el registro, un permiso revocado no identifica el mint y un hueco no se convierte en un hecho.","en":"On a case other than the cards, the criterion does not change: the address is compared with the registry, a revoked permission does not identify the mint, and a gap does not become a fact."},"whyWrong":{"fiarse-del-nombre":{"es":"El nombre, aunque lleve la palabra Oficial, no es la dirección. Y no disponible no es una concentración leída.","en":"The name, even with the word Oficial, is not the address. And unavailable is not a concentration that was read."},"revocada-es-registro":{"es":"La emisión revocada describe un permiso. Si la cadena de la dirección es otra, no es el mint del registro.","en":"Revoked mint authority describes a permission. If the address string is different, it is not the registry mint."}}}]},"cards":{"TNWwnzecb37272ZoySDE6D2UcmqNnU12EqtycNSpump":{"mint":"TNWwnzecb37272ZoySDE6D2UcmqNnU12EqtycNSpump","role":"registro","roleNote":{"es":"Mint del registro curado de STUBX en esta tanda.","en":"STUBX mint in the curated registry for this batch."},"id":"2504203e59fc6819f4541c650b35fa3c8a49527fc2349cd33b2ee5d12abd97bb","createdAt":"2026-10-08T07:41:29.694Z","partial":true,"referenceSlot":454480471,"name":"STUBX","nameStatus":"verificado","symbol":"STUBX","inRegistry":true,"inRegistryStatus":"verificado","mintAuthority":{"state":"revocada","status":"verificado"},"freezeAuthority":{"state":"revocada","status":"verificado"},"metadataReading":"no_mutables_en_fuentes","metadataLevel":"ok","holdersStatus":"no_disponible","holdersNote":"Sin respuesta utilizable. No se interpreta como autoridad revocada, como inmutabilidad ni como reserva cero.","impersonation":false,"authenticityLevel":"ok","signals":["mint en el registro"],"statement":"El mint coincide con el registro curado (stubx). Que esté en el registro no es una auditoría.","statementStatus":"verificado","curvePresent":true,"curvePresentStatus":"verificado","curveProgress":"1.74","curveProgressStatus":"inferido","curveProgressNote":"Porcentaje inferido con la reserva real inicial pública de la curva clásica (793100000000000). Truncado a 2 decimales hacia cero.","curveModuleNote":"Cuenta con el discriminador público de BondingCurve.","rulesVersion":"0.1.0"},"Hhq4ffySVX3UQqSowjhP1Lwa8YuJDf7iH2hYWvVHTuEf":{"mint":"Hhq4ffySVX3UQqSowjhP1Lwa8YuJDf7iH2hYWvVHTuEf","role":"clon","roleNote":{"es":"Clon conocido en los ejemplos del 2026-10-08. La ficha marca posible suplantación y no atribuye intención.","en":"Known clone in the 2026-10-08 examples. The card marks possible impersonation and does not attribute intent."},"id":"2c5de795c4aab2014c94dd6ed2fbda4564256b5e00c6fe929f1b7392639393b0","createdAt":"2026-10-08T07:41:49.581Z","partial":true,"referenceSlot":454480545,"name":"Comunidad STUBX · Creador","nameStatus":"verificado","symbol":"COMUNIDAD","inRegistry":false,"inRegistryStatus":"verificado","mintAuthority":{"state":"revocada","status":"verificado"},"freezeAuthority":{"state":"revocada","status":"verificado"},"metadataReading":"no_mutables_en_fuentes","metadataLevel":"ok","holdersStatus":"no_disponible","holdersNote":"Sin respuesta utilizable. No se interpreta como autoridad revocada, como inmutabilidad ni como reserva cero.","impersonation":true,"authenticityLevel":"riesgo","signals":["nombre «Comunidad STUBX · Creador» incluye STUBX/STUBX","enlace «https://stubxai.com/canales» coincide con un enlace u host del registro"],"statement":"Posible suplantación: el nombre, el símbolo, la imagen o un enlace coinciden con un token del registro curado, pero el mint es otro. La coincidencia no atribuye intención.","statementStatus":"inferido","curvePresent":true,"curvePresentStatus":"verificado","curveProgress":"0.00","curveProgressStatus":"inferido","curveProgressNote":"Porcentaje inferido con la reserva real inicial pública de la curva clásica (793100000000000). Truncado a 2 decimales hacia cero.","curveModuleNote":"Cuenta con el discriminador público de BondingCurve.","rulesVersion":"0.1.0"},"DjEjb6bxQ3Hjej9CzUAVeRqyt7k1tevHgcS37t41PUhQ":{"mint":"DjEjb6bxQ3Hjej9CzUAVeRqyt7k1tevHgcS37t41PUhQ","role":"clon","roleNote":{"es":"Clon conocido en los ejemplos del 2026-10-08. La ficha marca posible suplantación y no atribuye intención.","en":"Known clone in the 2026-10-08 examples. The card marks possible impersonation and does not attribute intent."},"id":"e19ccb6b9ab284a1349b1c0bd7472c1cbb1f3eb9808c37c752c85418b4239a32","createdAt":"2026-10-08T07:42:08.413Z","partial":true,"referenceSlot":454480614,"name":"Comunidad STUBX","nameStatus":"verificado","symbol":"COMUNIDAD","inRegistry":false,"inRegistryStatus":"verificado","mintAuthority":{"state":"revocada","status":"verificado"},"freezeAuthority":{"state":"revocada","status":"verificado"},"metadataReading":"no_mutables_en_fuentes","metadataLevel":"ok","holdersStatus":"no_disponible","holdersNote":"Sin respuesta utilizable. No se interpreta como autoridad revocada, como inmutabilidad ni como reserva cero.","impersonation":true,"authenticityLevel":"riesgo","signals":["nombre «Comunidad STUBX» incluye STUBX/STUBX","enlace «https://stubxai.com/canales» coincide con un enlace u host del registro"],"statement":"Posible suplantación: el nombre, el símbolo, la imagen o un enlace coinciden con un token del registro curado, pero el mint es otro. La coincidencia no atribuye intención.","statementStatus":"inferido","curvePresent":true,"curvePresentStatus":"verificado","curveProgress":"0.00","curveProgressStatus":"inferido","curveProgressNote":"Porcentaje inferido con la reserva real inicial pública de la curva clásica (793100000000000). Truncado a 2 decimales hacia cero.","curveModuleNote":"Cuenta con el discriminador público de BondingCurve.","rulesVersion":"0.1.0"},"3Zi6p6wzYZYKyuHdBhsDfb2pRR7XTfTfLKkXL7rwpump":{"mint":"3Zi6p6wzYZYKyuHdBhsDfb2pRR7XTfTfLKkXL7rwpump","role":"clon","roleNote":{"es":"Clon conocido en los ejemplos del 2026-10-08. La ficha marca posible suplantación y no atribuye intención.","en":"Known clone in the 2026-10-08 examples. The card marks possible impersonation and does not attribute intent."},"id":"6da15234e08bd8507731922297162664cf9c16690397d4fbe2777a8f6c32d44c","createdAt":"2026-10-08T07:42:27.686Z","partial":true,"referenceSlot":454480685,"name":"Comunidad STUBX","nameStatus":"verificado","symbol":"COMUNIDAD","inRegistry":false,"inRegistryStatus":"verificado","mintAuthority":{"state":"revocada","status":"verificado"},"freezeAuthority":{"state":"revocada","status":"verificado"},"metadataReading":"no_mutables_en_fuentes","metadataLevel":"ok","holdersStatus":"no_disponible","holdersNote":"Sin respuesta utilizable. No se interpreta como autoridad revocada, como inmutabilidad ni como reserva cero.","impersonation":true,"authenticityLevel":"riesgo","signals":["nombre «Comunidad STUBX» incluye STUBX/STUBX","enlace «https://stubxai.com/canales» coincide con un enlace u host del registro"],"statement":"Posible suplantación: el nombre, el símbolo, la imagen o un enlace coinciden con un token del registro curado, pero el mint es otro. La coincidencia no atribuye intención.","statementStatus":"inferido","curvePresent":true,"curvePresentStatus":"verificado","curveProgress":"0.00","curveProgressStatus":"inferido","curveProgressNote":"Porcentaje inferido con la reserva real inicial pública de la curva clásica (793100000000000). Truncado a 2 decimales hacia cero.","curveModuleNote":"Cuenta con el discriminador público de BondingCurve.","rulesVersion":"0.1.0"},"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v":{"mint":"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v","role":"contraste","roleNote":{"es":"USDC, usado en los ejemplos como contraste: autoridades activas. No es STUBX y no está presentado como clon.","en":"USDC, used in the examples as a contrast: active authorities. It is not STUBX and is not presented as a clone."},"id":"e79f2d70db92ceab639eccd2d30a32640fd8eb6baf2a0a764d4a7a587179ad60","createdAt":"2026-10-08T07:44:19.870Z","partial":true,"referenceSlot":454481103,"name":"USD Coin","nameStatus":"verificado","symbol":"USDC","inRegistry":false,"inRegistryStatus":"verificado","mintAuthority":{"state":"activa","status":"verificado"},"freezeAuthority":{"state":"activa","status":"verificado"},"metadataReading":"mutables","metadataLevel":"atención","holdersStatus":"no_disponible","holdersNote":"Sin respuesta utilizable. No se interpreta como autoridad revocada, como inmutabilidad ni como reserva cero.","impersonation":false,"authenticityLevel":"ok","signals":[],"statement":"Este mint no está en el registro curado. Que no esté no significa que sea falso ni que sea una copia.","statementStatus":"verificado","curvePresent":false,"curvePresentStatus":"verificado","curveProgress":null,"curveProgressStatus":"no_aplica","curveProgressNote":"No hay curva. No se rellena con cero.","curveModuleNote":"La dirección derivada tiene una cuenta cuyo propietario no es el programa de Pump.fun. No es una curva y no se rellenan reservas a cero.","rulesVersion":"0.1.0"}},"glossary":[{"id":"direccion","term":{"es":"Dirección del mint","en":"Mint address"},"means":{"es":"Es la dirección de la cuenta del token. Identifica ese mint en la red de la ficha. El nombre y el símbolo son textos aparte.","en":"It is the address of the token account. It identifies that mint on the network named in the card. The name and the symbol are separate text."},"example":{"es":"En las fichas del 2026-10-08, TNWwnzecb37272ZoySDE6D2UcmqNnU12EqtycNSpump y DjEjb6bxQ3Hjej9CzUAVeRqyt7k1tevHgcS37t41PUhQ son direcciones distintas aunque los nombres se parezcan.","en":"On the 2026-10-08 cards, TNWwnzecb37272ZoySDE6D2UcmqNnU12EqtycNSpump and DjEjb6bxQ3Hjej9CzUAVeRqyt7k1tevHgcS37t41PUhQ are different addresses even if the names look alike."},"doesNotConclude":{"es":"No dice quién es una persona, ni si conviene hacer nada con el token. Dos nombres iguales no son la misma dirección.","en":"It does not name a person, and it does not say that any action with the token is advisable. Two equal names are not the same address."}},{"id":"registro","term":{"es":"Registro curado","en":"Curated registry"},"means":{"es":"Lista local que Verify compara con el mint, el nombre, el símbolo, la imagen y algunos enlaces. Hoy incluye STUBX. Que un mint no esté no significa que sea falso.","en":"A local list Verify compares with the mint, name, symbol, image, and some links. Today it includes STUBX. A mint that is absent is not therefore false."},"example":{"es":"USDC, en la ficha del 2026-10-08, no está en el registro. La propia ficha dice que eso no significa que sea falso ni una copia.","en":"USDC, on the 2026-10-08 card, is not in the registry. The card itself says that does not mean it is false or a copy."},"doesNotConclude":{"es":"Estar en el registro no es una auditoría ni una garantía. No estar tampoco es una acusación.","en":"Being in the registry is not an audit or a guarantee. Being absent is not an accusation either."}},{"id":"autoridad-emision","term":{"es":"Autoridad de emisión","en":"Mint authority"},"means":{"es":"Permiso para aumentar el suministro de ese mint. Si la ficha dice revocada y el campo está verificado, la opción leída está en 0. Si dice activa, el permiso sigue asignado a una dirección.","en":"Permission to increase the supply of that mint. If the card says revoked and the field is verified, the option that was read is 0. If it says active, the permission is still assigned to an address."},"example":{"es":"En la tanda del 2026-10-08, el mint del registro y los clones la tienen revocada. USDC la tiene activa.","en":"In the 2026-10-08 batch, the registry mint and the clones have it revoked. USDC has it active."},"doesNotConclude":{"es":"Revocada no identifica el mint, no demuestra que el proyecto sea legítimo y no dice nada de la demanda ni de la liquidez. Un campo no disponible no se rellena como revocada.","en":"Revoked does not identify the mint, does not show that the project is legitimate, and says nothing about demand or liquidity. An unavailable field is not filled in as revoked."}},{"id":"autoridad-congelacion","term":{"es":"Autoridad de congelación","en":"Freeze authority"},"means":{"es":"Permiso para congelar cuentas de ese token. Revocada quita ese permiso concreto en la lectura. Activa significa que sigue asignado.","en":"Permission to freeze accounts of that token. Revoked removes that specific permission in the reading. Active means it is still assigned."},"example":{"es":"En la misma tanda, el mint del registro la tiene revocada y USDC la tiene activa, asignada a una dirección que la ficha muestra.","en":"In the same batch, the registry mint has it revoked and USDC has it active, assigned to an address the card shows."},"doesNotConclude":{"es":"No es una garantía ni una prueba de identidad. Que no haya este permiso no impide otras limitaciones del token.","en":"It is not a guarantee or proof of identity. The absence of this permission does not remove other limits of the token."}},{"id":"metadatos-mutables","term":{"es":"Metadatos mutables","en":"Mutable metadata"},"means":{"es":"Si hay una autoridad de actualización o is_mutable es verdadero, el nombre, el símbolo o la imagen pueden cambiar. «No mutables en las fuentes leídas» describe esas fuentes en esa fecha.","en":"If there is an update authority or is_mutable is true, the name, symbol, or image can change. “Not mutable in the sources read” describes those sources on that date."},"example":{"es":"El mint del registro, el 2026-10-08, queda como no mutable en las fuentes leídas. USDC tiene is_mutable verdadero en Metaplex.","en":"The registry mint, on 2026-10-08, is recorded as not mutable in the sources read. USDC has is_mutable true in Metaplex."},"doesNotConclude":{"es":"Que no se puedan cambiar en esa lectura no demuestra legitimidad. Que se puedan cambiar no es, por sí solo, una suplantación.","en":"That they cannot be changed in that reading does not show legitimacy. That they can be changed is not, by itself, impersonation."}},{"id":"desconocido","term":{"es":"Desconocido y no disponible","en":"Unknown and unavailable"},"means":{"es":"No disponible significa que esa llamada no dejó un dato utilizable. Desconocido es lo que no se leyó. Ninguno de los dos es un valor comprobado.","en":"Unavailable means that call did not leave a usable fact. Unknown is what was not read. Neither one is a verified value."},"example":{"es":"En las cinco fichas del 2026-10-08, getTokenLargestAccounts respondió HTTP 429. La muestra de holders queda en no disponible. No es concentración cero.","en":"On all five cards from 2026-10-08, getTokenLargestAccounts returned HTTP 429. The holder sample stays unavailable. It is not zero concentration."},"doesNotConclude":{"es":"No se convierte en cero, en autoridad revocada ni en metadatos inmutables. Una ficha parcial tampoco anula los campos que sí están verificados.","en":"It does not become zero, a revoked authority, or immutable metadata. A partial card also does not cancel the fields that are verified."}},{"id":"curva-pump","term":{"es":"Curva de Pump.fun","en":"Pump.fun curve"},"means":{"es":"Si la cuenta derivada es del programa de la curva, Verify lee sus campos públicos. El avance clásico es un cálculo inferido, no un campo de la cuenta. Si no hay curva, no se rellenan reservas con cero.","en":"If the derived account belongs to the curve program, Verify reads its public fields. Classic progress is an inferred calculation, not a field of the account. If there is no curve, reserves are not filled in with zero."},"example":{"es":"El 2026-10-08 el mint del registro tiene avance inferido 1,74. Los clones tienen 0,00 inferido porque la reserva real coincide con la inicial documentada. USDC no es una curva: el avance queda en no aplica.","en":"On 2026-10-08 the registry mint has inferred progress 1.74. The clones have inferred 0.00 because the real reserve matches the documented initial reserve. USDC is not a curve: progress stays not applicable."},"doesNotConclude":{"es":"El avance no dice qué hacer. 0,00 inferido no significa que faltara la cuenta. Esta misión no simula un intercambio.","en":"Progress does not say what to do. Inferred 0.00 does not mean the account was missing. This mission does not simulate a swap."}},{"id":"reserva-real","term":{"es":"Reserva real","en":"Real reserve"},"means":{"es":"Campo real_token_reserves o real_quote_reserves de la cuenta de la curva, en unidades mínimas. Es distinto de la reserva virtual.","en":"The real_token_reserves or real_quote_reserves field of the curve account, in base units. It is different from the virtual reserve."},"example":{"es":"En los clones del 2026-10-08, la reserva real de tokens coincide con 793100000000000, la inicial documentada de la curva clásica. Por eso el avance inferido es 0,00.","en":"On the 2026-10-08 clones, the real token reserve matches 793100000000000, the documented initial reserve of the classic curve. That is why inferred progress is 0.00."},"doesNotConclude":{"es":"No es una auditoría de fondos ni un saldo que esta página calcule como retirable. Si el campo no está, no se inventa un cero.","en":"It is not an audit of funds, and this page does not compute it as a withdrawable balance. If the field is absent, a zero is not invented."}},{"id":"reserva-virtual","term":{"es":"Reserva virtual","en":"Virtual reserve"},"means":{"es":"Campo virtual_token_reserves o virtual_quote_reserves. La ficha lo separa de la reserva real. En la curva clásica, y con la quote por defecto, la reserva quote va en lamports.","en":"The virtual_token_reserves or virtual_quote_reserves field. The card keeps it apart from the real reserve. On the classic curve, and with the default quote, the quote reserve is in lamports."},"example":{"es":"La ficha del mint del registro, el 2026-10-08, muestra reserva virtual de tokens y reserva real de tokens como números distintos, cada una con su estado.","en":"The registry mint card, on 2026-10-08, shows a virtual token reserve and a real token reserve as different numbers, each with its own status."},"doesNotConclude":{"es":"La reserva virtual no es el fondo retirable. Sumarla con la real no crea un único fondo disponible.","en":"The virtual reserve is not the withdrawable balance. Adding it to the real reserve does not create one available pool."}},{"id":"suplantacion","term":{"es":"Posible suplantación","en":"Possible impersonation"},"means":{"es":"Señal de Verify: el nombre, el símbolo, la imagen o un enlace coinciden con el registro curado y el mint es otro. La coincidencia no atribuye intención.","en":"A Verify signal: the name, symbol, image, or a link matches the curated registry and the mint is a different one. The match does not attribute intent."},"example":{"es":"Las fichas de Hhq4ffySVX3UQqSowjhP1Lwa8YuJDf7iH2hYWvVHTuEf, DjEjb6bxQ3Hjej9CzUAVeRqyt7k1tevHgcS37t41PUhQ y 3Zi6p6wzYZYKyuHdBhsDfb2pRR7XTfTfLKkXL7rwpump, del 2026-10-08, llevan esa señal. USDC no.","en":"The 2026-10-08 cards for Hhq4ffySVX3UQqSowjhP1Lwa8YuJDf7iH2hYWvVHTuEf, DjEjb6bxQ3Hjej9CzUAVeRqyt7k1tevHgcS37t41PUhQ, and 3Zi6p6wzYZYKyuHdBhsDfb2pRR7XTfTfLKkXL7rwpump carry that signal. USDC does not."},"doesNotConclude":{"es":"No es una sentencia ni una prueba de lo que alguien quiso hacer. Un nombre parecido, por sí solo, tampoco sustituye a leer la dirección.","en":"It is not a verdict or proof of what someone meant to do. A similar name, by itself, also does not replace reading the address."}},{"id":"titular","term":{"es":"Titular y persona","en":"Holder of a key and a person"},"means":{"es":"Una dirección guardada en una cuenta, como el creator de la curva, es un campo público. No identifica a una persona ni a un titular jurídico.","en":"An address stored on an account, such as the curve creator, is a public field. It does not identify a person or a legal holder."},"example":{"es":"La ficha del mint del registro anota el creator de la curva y dice que esa pubkey no identifica a una persona.","en":"The registry mint card records the curve creator and says that pubkey does not identify a person."},"doesNotConclude":{"es":"No se puede pasar de una dirección a un nombre de persona con esta misión. No pide datos personales.","en":"This mission cannot turn an address into a person's name. It does not ask for personal data."}},{"id":"comision","term":{"es":"Comisión","en":"Fee"},"means":{"es":"Regla de un conector sobre un intercambio. Esta misión no calcula comisiones ni intercambios.","en":"A connector rule about a swap. This mission does not calculate fees or swaps."},"example":{"es":"Las fichas usadas aquí leen campos públicos de la curva. No incluyen un cálculo de comisión, y esta página no lo añade.","en":"The cards used here read public curve fields. They do not include a fee calculation, and this page does not add one."},"doesNotConclude":{"es":"Una comisión no identifica el mint, no convierte la reserva virtual en fondos retirables y no es un resultado prometido.","en":"A fee does not identify the mint, does not turn the virtual reserve into withdrawable funds, and is not a promised result."}}],"cardDate":"2026-10-08"};
const STORAGE_KEY = "stubx-lab-mision-01";
const LANG_KEY = "stubx-lab-lang";
const PROGRESS_ECONOMIC_VALUE = 0;
const PROGRESS_IS_CERTIFICATE = false;
function record(value) {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        return value;
    }
    return null;
}
function initialProgress(mission, lang) {
    return {
        version: 1,
        missionId: mission.id,
        missionVersion: mission.version,
        lang,
        solved: [],
        attempts: {},
        completed: false,
    };
}
function resetProgress(mission, lang) {
    return initialProgress(mission, lang);
}
function withLang(progress, lang) {
    return { ...progress, lang };
}
function currentStep(mission, progress) {
    for (const step of mission.steps) {
        if (!progress.solved.includes(step.id)) {
            return step;
        }
    }
    return null;
}
function checkCount(mission) {
    return mission.steps.filter((step) => step.kind === "check").length;
}
function parseProgress(raw, mission) {
    const row = record(raw);
    if (!row) {
        return null;
    }
    if (row.version !== 1 || row.missionId !== mission.id || row.missionVersion !== mission.version) {
        return null;
    }
    if (row.lang !== "es" && row.lang !== "en") {
        return null;
    }
    if (!Array.isArray(row.solved) || typeof row.completed !== "boolean") {
        return null;
    }
    const ids = mission.steps.map((step) => step.id);
    const solved = [];
    for (let i = 0; i < row.solved.length; i += 1) {
        if (row.solved[i] !== ids[i]) {
            return null;
        }
        const id = ids[i];
        if (!id) {
            return null;
        }
        solved.push(id);
    }
    if (row.completed !== (solved.length === mission.steps.length)) {
        return null;
    }
    const attemptsRaw = record(row.attempts);
    if (!attemptsRaw) {
        return null;
    }
    const attempts = {};
    for (const [key, value] of Object.entries(attemptsRaw)) {
        if (!ids.includes(key)) {
            return null;
        }
        if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
            return null;
        }
        attempts[key] = value;
    }
    return {
        version: 1,
        missionId: mission.id,
        missionVersion: mission.version,
        lang: row.lang,
        solved,
        attempts,
        completed: row.completed,
    };
}
function answer(mission, progress, stepId, optionId) {
    if (progress.completed) {
        return { applied: false, code: "ya_completa", correct: false, explanation: null, progress };
    }
    const step = currentStep(mission, progress);
    if (!step || step.id !== stepId) {
        return { applied: false, code: "paso_no_actual", correct: false, explanation: null, progress };
    }
    const option = step.options.find((item) => item.id === optionId);
    if (!option) {
        return { applied: false, code: "opcion_desconocida", correct: false, explanation: null, progress };
    }
    if (optionId === step.correct) {
        const solved = [...progress.solved, step.id];
        const completed = solved.length === mission.steps.length;
        const explanation = step.whyRight;
        return {
            applied: true,
            code: "correcto",
            correct: true,
            explanation,
            progress: { ...progress, solved, completed },
        };
    }
    const explanation = step.whyWrong[optionId];
    if (!explanation) {
        return { applied: false, code: "opcion_desconocida", correct: false, explanation: null, progress };
    }
    const prev = progress.attempts[step.id] ?? 0;
    return {
        applied: true,
        code: "incorrecto",
        correct: false,
        explanation,
        progress: {
            ...progress,
            attempts: { ...progress.attempts, [step.id]: prev + 1 },
        },
    };
}
function findEntry(id) {
  var entries = STUBX_LAB.glossary;
  for (var i = 0; i < entries.length; i += 1) {
    if (entries[i].id === id) return entries[i];
  }
  return null;
}

function textOf(value, lang) {
  if (!value) return lang === "en" ? "unknown" : "desconocido";
  return value[lang] || value.es;
}

var STATUS_LABEL = {
  verificado: { es: "verificado", en: "verified" },
  inferido: { es: "inferido", en: "inferred" },
  no_disponible: { es: "no disponible", en: "unavailable" },
  no_aplica: { es: "no aplica", en: "not applicable" },
  desconocido: { es: "desconocido", en: "unknown" },
};

var FIELD_LABEL = {
  name: { es: "Nombre on-chain", en: "On-chain name" },
  mint: { es: "Dirección del mint", en: "Mint address" },
  inRegistry: { es: "En el registro curado", en: "In the curated registry" },
  statement: { es: "Lectura de autenticidad", en: "Authenticity statement" },
  mintAuthority: { es: "Autoridad de emisión", en: "Mint authority" },
  freezeAuthority: { es: "Autoridad de congelación", en: "Freeze authority" },
  metadata: { es: "Metadatos", en: "Metadata" },
  holders: { es: "Muestra de holders", en: "Holder sample" },
  impersonation: { es: "Señal de suplantación", en: "Impersonation signal" },
  curvePresent: { es: "Cuenta de curva", en: "Curve account" },
  curveProgress: { es: "Avance de la curva clásica", en: "Classic curve progress" },
};

var META_LABEL = {
  no_mutables_en_fuentes: { es: "No mutables en las fuentes leídas", en: "Not mutable in the sources read" },
  mutables: { es: "Mutables", en: "Mutable" },
  desconocido: { es: "Desconocido", en: "Unknown" },
};

function statusLabel(status, lang) {
  return textOf(STATUS_LABEL[status] || STATUS_LABEL.desconocido, lang);
}

function factText(status, value, lang) {
  if (status !== "verificado" && status !== "inferido") return statusLabel(status, lang);
  if (!value) return statusLabel(status, lang);
  return value + " · " + statusLabel(status, lang);
}

function yesNo(value, lang) {
  if (lang === "en") return value ? "yes" : "no";
  return value ? "sí" : "no";
}

function fieldText(card, key, lang) {
  if (key === "name") return { value: factText(card.nameStatus, card.name, lang), note: null };
  if (key === "mint") return { value: card.mint, note: null };
  if (key === "inRegistry") {
    var registry = card.inRegistry === null ? null : yesNo(card.inRegistry, lang);
    return { value: factText(card.inRegistryStatus, registry, lang), note: null };
  }
  if (key === "statement") return { value: factText(card.statementStatus, card.statement, lang), note: null };
  if (key === "mintAuthority") return { value: factText(card.mintAuthority.status, card.mintAuthority.state, lang), note: null };
  if (key === "freezeAuthority") return { value: factText(card.freezeAuthority.status, card.freezeAuthority.state, lang), note: null };
  if (key === "metadata") return { value: textOf(META_LABEL[card.metadataReading], lang), note: null };
  if (key === "holders") return { value: factText(card.holdersStatus, null, lang), note: card.holdersNote };
  if (key === "impersonation") {
    if (card.impersonation === null) return { value: statusLabel("desconocido", lang), note: null };
    var label = card.impersonation
      ? (lang === "en" ? "Possible impersonation" : "Posible suplantación")
      : (lang === "en" ? "No such signal" : "Sin esa señal");
    return { value: label + (card.authenticityLevel ? " · " + card.authenticityLevel : ""), note: null };
  }
  if (key === "curvePresent") {
    var present = card.curvePresent === null ? null : yesNo(card.curvePresent, lang);
    return { value: factText(card.curvePresentStatus, present, lang), note: card.curveModuleNote };
  }
  if (key === "curveProgress") {
    var progress = card.curveProgress ? (lang === "en" ? card.curveProgress + "%" : card.curveProgress + " %") : null;
    return { value: factText(card.curveProgressStatus, progress, lang), note: card.curveProgressNote };
  }
  return { value: statusLabel("desconocido", lang), note: null };
}

function el(tag, attrs) {
  var node = document.createElement(tag);
  if (!attrs) return node;
  Object.keys(attrs).forEach(function (key) {
    if (attrs[key] != null) node.setAttribute(key, String(attrs[key]));
  });
  return node;
}

function bootLab() {
  var root = document.getElementById("mision-app");
  if (!root) return;
  var mission = STUBX_LAB.mission;
  var lang = document.documentElement.getAttribute("data-lang") === "en" ? "en" : "es";
  var stored = null;
  try {
    stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch (error) {
    stored = null;
  }
  var progress = parseProgress(stored, mission) || initialProgress(mission, lang);
  progress = withLang(progress, lang);
  var banner = null;
  var focusBanner = false;
  var saveError = false;
  var reviewId = null;

  function liveStep() {
    return currentStep(mission, progress);
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
      saveError = false;
    } catch (error) {
      saveError = true;
    }
  }

  function openHelp(id) {
    var entry = findEntry(id);
    var dialog = document.getElementById("ayuda");
    var anchor = document.getElementById("termino-" + id);
    if (!entry || !dialog || typeof dialog.showModal !== "function") {
      if (anchor) anchor.scrollIntoView();
      return;
    }
    var title = document.getElementById("ayuda-titulo");
    var body = document.getElementById("ayuda-cuerpo");
    var closeBtn = document.getElementById("ayuda-cerrar");
    if (!title || !body) return;
    title.textContent = entry.term[lang];
    body.replaceChildren();
    ["means", "example", "doesNotConclude"].forEach(function (key) {
      var paragraph = el("p");
      paragraph.textContent = entry[key][lang];
      body.append(paragraph);
    });
    var stay = el("p");
    stay.textContent = lang === "en"
      ? "Opening help does not change local progress."
      : "Abrir la ayuda no cambia el progreso local.";
    body.append(stay);
    if (closeBtn) closeBtn.textContent = lang === "en" ? "Close" : "Cerrar";
    dialog.returnFocus = document.activeElement;
    dialog.showModal();
  }

  var dialogNode = document.getElementById("ayuda");
  if (dialogNode) {
    dialogNode.addEventListener("close", function () {
      var back = dialogNode.returnFocus;
      if (back && back.focus) back.focus();
    });
  }

  function cardNode(card, fields) {
    var article = el("article", { class: "ficha" });
    var heading = el("h3");
    heading.textContent = card.name || card.mint;
    var role = el("p", { class: "rol" });
    role.textContent = card.roleNote[lang];
    var mint = el("p");
    var code = el("code", { class: "mint" });
    code.textContent = card.mint;
    mint.append(code);
    var list = el("dl");
    fields.forEach(function (key) {
      var item = fieldText(card, key, lang);
      var term = el("dt");
      term.textContent = textOf(FIELD_LABEL[key], lang);
      var detail = el("dd");
      detail.textContent = item.value;
      if (item.note) {
        var note = el("p", { class: "muted" });
        note.textContent = item.note;
        detail.append(note);
      }
      list.append(term, detail);
    });
    article.append(heading, role, mint, list);
    return article;
  }

  function helpButtons(step) {
    var row = el("div", { class: "opciones" });
    step.glossary.forEach(function (id) {
      var entry = findEntry(id);
      var button = el("button", { type: "button", class: "secondary" });
      var name = entry ? entry.term[lang] : id;
      button.textContent = (lang === "en" ? "Help: " : "Ayuda: ") + name;
      button.addEventListener("click", function () { openHelp(id); });
      row.append(button);
    });
    return row;
  }

  function resetButton() {
    var button = el("button", { type: "button", class: "secondary" });
    button.textContent = lang === "en" ? "Delete local progress" : "Borrar progreso local";
    button.addEventListener("click", function () {
      var question = lang === "en"
        ? "Delete the local progress of this mission in this browser?"
        : "¿Borrar el progreso local de esta misión en este navegador?";
      if (!window.confirm(question)) return;
      progress = resetProgress(mission, lang);
      banner = null;
      reviewId = null;
      save();
      render();
    });
    return button;
  }

  function render() {
    root.replaceChildren();
    var checks = mission.steps.filter(function (step) { return step.kind === "check"; }).length;
    var nav = el("ol", { class: "pasos" });
    mission.steps.forEach(function (step, index) {
      var item = el("li");
      var button = el("button", { type: "button", class: "secondary" });
      var solved = progress.solved.indexOf(step.id) !== -1;
      var active = liveStep();
      var isLive = Boolean(active && active.id === step.id);
      var showing = reviewId ? reviewId === step.id : isLive;
      var label = step.kind === "check"
        ? String(index + 1)
        : (lang === "en" ? "Case" : "Caso");
      button.textContent = label;
      if (!solved && !isLive) button.disabled = true;
      if (showing) button.setAttribute("aria-current", "step");
      button.addEventListener("click", function () {
        reviewId = solved && !isLive ? step.id : null;
        banner = null;
        render();
      });
      item.append(button);
      nav.append(item);
    });
    if (progress.completed) {
      var resultButton = el("button", { type: "button" });
      resultButton.textContent = lang === "en" ? "Result" : "Resultado";
      if (reviewId === null) resultButton.setAttribute("aria-current", "step");
      resultButton.addEventListener("click", function () {
        reviewId = null;
        banner = null;
        render();
      });
      var resultItem = el("li");
      resultItem.append(resultButton);
      nav.append(resultItem);
    }
    root.append(nav);

    if (saveError) {
      var warn = el("p", { class: "nota" });
      warn.textContent = lang === "en"
        ? "This browser did not store the progress. It will disappear when the page closes."
        : "Este navegador no guardó el progreso. Se pierde al cerrar la página.";
      root.append(warn);
    }

    if (banner) {
      var feedback = el("div", { class: "feedback", role: "status", tabindex: "-1" });
      var feedbackTitle = el("h2");
      feedbackTitle.textContent = banner.correct
        ? (lang === "en" ? "That answer fits" : "Esa respuesta encaja")
        : (lang === "en" ? "That answer does not fit" : "Esa respuesta no encaja");
      var feedbackBody = el("p");
      feedbackBody.textContent = banner.explanation[lang];
      var again = el("p");
      again.textContent = banner.correct
        ? (lang === "en" ? "You can continue. There is no score and no penalty." : "Puedes seguir. No hay puntuación ni penalización.")
        : (lang === "en" ? "You can choose another answer. There is no penalty." : "Puedes elegir otra respuesta. No hay penalización.");
      feedback.append(feedbackTitle, feedbackBody, again);
      root.append(feedback);
    }

    var showingResult = progress.completed && reviewId === null;
    if (showingResult) {
      var done = el("section");
      var doneTitle = el("h2");
      doneTitle.textContent = lang === "en" ? "Result" : "Resultado";
      done.append(doneTitle);
      mission.steps.forEach(function (step, index) {
        var block = el("article", { class: "ficha" });
        var name = el("h3");
        name.textContent = (step.kind === "check" ? (index + 1) + ". " : "") + step.prompt[lang];
        var line = el("p");
        line.textContent = step.whyRight[lang];
        block.append(name, line);
        done.append(block);
      });
      var close = el("p");
      close.textContent = mission.closing[lang];
      var dated = el("p");
      dated.textContent = lang === "en"
        ? "The cards are from " + STUBX_LAB.cardDate + ". Unknown is not the same as verified."
        : "Las fichas son del " + STUBX_LAB.cardDate + ". Lo desconocido no es lo mismo que lo comprobado.";
      done.append(close, dated, resetButton());
      root.append(done);
    } else {
      var stepId = reviewId || (liveStep() ? liveStep().id : mission.steps[0].id);
      var step = null;
      for (var i = 0; i < mission.steps.length; i += 1) {
        if (mission.steps[i].id === stepId) step = mission.steps[i];
      }
      if (!step) return;
      var section = el("section");
      var heading = el("h2");
      var position = mission.steps.indexOf(step);
      heading.textContent = step.kind === "check"
        ? (lang === "en" ? "Check " + (position + 1) + " of " + checks : "Comprobación " + (position + 1) + " de " + checks)
        : (lang === "en" ? "Comprehension check" : "Comprobación de comprensión");
      var guide = el("p");
      guide.textContent = step.guide[lang];
      section.append(heading, guide, helpButtons(step));
      step.cards.forEach(function (mint) {
        var card = STUBX_LAB.cards[mint];
        if (card) section.append(cardNode(card, step.fields));
      });
      var prompt = el("h3");
      prompt.textContent = step.prompt[lang];
      section.append(prompt);
      var solved = progress.solved.indexOf(step.id) !== -1;
      if (solved) {
        var lesson = el("p");
        lesson.textContent = step.whyRight[lang];
        var locked = el("p", { class: "muted" });
        locked.textContent = lang === "en"
          ? "This check is already done. To try it again, delete the local progress."
          : "Esta comprobación ya está hecha. Para repetirla, borra el progreso local.";
        section.append(lesson, locked);
      } else {
        var options = el("div", { class: "opciones", role: "group" });
        options.setAttribute("aria-labelledby", "pregunta-actual");
        prompt.id = "pregunta-actual";
        step.options.forEach(function (option) {
          var button = el("button", { type: "button" });
          button.textContent = option.label[lang];
          button.addEventListener("click", function () {
            var grade = answer(mission, progress, step.id, option.id);
            if (!grade.applied) return;
            progress = grade.progress;
            banner = { correct: grade.correct, explanation: grade.explanation };
            focusBanner = true;
            if (grade.correct) reviewId = null;
            save();
            render();
          });
          options.append(button);
        });
        section.append(options);
      }
      section.append(resetButton());
      root.append(section);
    }

    if (focusBanner) {
      var region = root.querySelector(".feedback");
      if (region) region.focus();
      focusBanner = false;
    }
  }

  document.addEventListener("stubx-lang", function (event) {
    lang = event.detail === "en" ? "en" : "es";
    progress = withLang(progress, lang);
    save();
    render();
  });

  save();
  render();
}
bootLab();
})();
