# Mes listes de tâches

[Essayer la démo publique](https://mes-listes-de-taches.onrender.com). Le premier chargement peut prendre environ une minute après la mise en veille du service gratuit.

Un agenda privé pour organiser ses tâches par liste, choisir une priorité et garder les échéances visibles. L’application propose une vue d’ensemble, les tâches du jour, les retards et les tâches terminées. L’affichage en tableau sépare les actions à faire des actions terminées.

La semaine, à droite de la feuille sur grand écran et au-dessus des tâches sur mobile, permet d’ouvrir les échéances d’une date, parcourir les semaines et revenir à aujourd’hui. Changer de semaine quitte le filtre d’une date pour revenir à la vue d’ensemble. Créer une tâche depuis une journée préremplit sa date. Une tâche peut contenir jusqu’à 20 étapes, cochables depuis sa ligne ou son formulaire. Copier une tâche ouvre une version modifiable avec ses notes, sa priorité et son échéance ; les étapes sont remises à faire. La copie n’est créée qu’après confirmation.

L’inscription demande une adresse e-mail et un mot de passe. Le prénom est facultatif, dans une section repliée ; à défaut, la partie précédant l’arobase sert de nom personnel et reste modifiable dans le profil. Le compte est connecté après sa création. Le bouton Voir permet de vérifier le mot de passe sans le saisir une deuxième fois.

Chaque compte possède ses propres listes. Les tâches peuvent être déplacées, annotées, terminées puis rouvertes. La recherche, le tri et l’export JSON utilisent les données du compte. La modification du profil et la suppression du compte sont disponibles dans le menu personnel.

## Installation locale

Prérequis : **Node.js 24.15 ou plus récent**, npm et PostgreSQL 15 ou plus récent. Docker Compose peut démarrer une base dédiée ; aucun compte cloud n’est nécessaire.

```sh
npm ci
npm run patch:dependencies
npm run patch:devtools
npm run configure
docker compose up -d
npm run db:generate
npm run db:migrate
```

`configure` crée les deux fichiers `.env` absents et génère deux secrets distincts. Il conserve les fichiers existants. Les paramètres disponibles figurent dans `backend/.env.example` et `frontend/.env.example`.

Démarrer l’API et le client dans deux terminaux :

```sh
npm run api
```

```sh
npm run dev
```

Ouvrir **http://127.0.0.1:4312** et créer un compte. L’API écoute sur **http://127.0.0.1:8012/api**, sa documentation de développement sur `/api/docs`. La base Docker utilise le port local **55412** et le volume `task_data`. Le mot de passe du conteneur est réservé au développement local. Avec un PostgreSQL déjà installé, adapter `DATABASE_URL` et créer une base vide avant la migration.

Le schéma initial remplace l’ancienne structure du projet. Ces migrations concernent une **nouvelle base dédiée** ; elles ne migrent pas les anciennes données. Arrêter Docker avec `docker compose stop` conserve les données. `docker compose down -v` efface le volume local.

## Architecture et stack

- Client : Nuxt 4, Vue 3, Nuxt UI 4, Tailwind CSS 4 et TypeScript strict. Archivo et les icônes sont servis localement ; la licence de la police est conservée dans `frontend/public/fonts/`.
- API : NestJS 12, PostgreSQL, Prisma 7 avec adaptateur `pg`, TypeScript strict et compilation ESM avec métadonnées de décorateurs.
- Métier : services séparés pour les comptes, sessions, listes et tâches ; contraintes uniques et suppressions en cascade dans PostgreSQL.
- Frontières : validation des entrées par DTO, rejet des champs inconnus, réponses contrôlées par Zod dans le client. Une échéance choisie est enregistrée à midi UTC et affichée en UTC pour préserver la date saisie dans les autres fuseaux.

L’authentification utilise des cookies HttpOnly et SameSite. Les mots de passe sont hachés avec bcrypt ; la limite de 72 octets est validée avant hachage. Chaque session conserve uniquement l’empreinte SHA-256 du jeton de renouvellement. La rotation possède un identifiant unique et vérifie atomiquement l’ancienne empreinte. La déconnexion révoque la session côté serveur, y compris un jeton d’accès copié ; les autres appareils restent connectés.

Les créations du nouveau client portent une clé UUID. Une transaction PostgreSQL associe cette clé à la tâche et à l’empreinte de son contenu : deux envois simultanés ou une réponse perdue suivie d’une reprise gardent un seul identifiant. Une clé réutilisée avec un autre contenu renvoie 409. Après suppression, une trace technique minimale bloque la recréation tardive ; supprimer le compte retire ces traces. Le contrat historique sans clé reste accepté.

Les visiteurs voient l’identification, et le compte connecté dispose de son profil et de la déconnexion. Les formulaires de connexion restent masqués pendant la restauration d’une session. Une déconnexion ou suppression de compte annonce la fin de session aux autres onglets avec BroadcastChannel. Le retour dans un onglet et une vérification toutes les 30 secondes relisent aussi la session et ses données. Sans BroadcastChannel, ces vérifications actualisent l’état. Un changement de compte ferme les anciens formulaires et recharge uniquement les listes du nouveau compte. Une requête d’une ancienne session n’est pas automatiquement réessayée sous un autre compte : elle est annulée avec une erreur explicite.

Les modifications de tâches, listes, checklists et profils portent leur version d’origine. Une modification concurrente est signalée sans écraser les données récentes, et le formulaire conserve sa saisie. Le client coordonne les renouvellements entre onglets avec Web Locks lorsque le navigateur le permet.

## Vérifications

```sh
npm run test:security
npm run test:compat
npm run audit:verified
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run e2e
```

`npm test` crée une base PostgreSQL temporaire puis la supprime. `TEST_DATABASE_URL` désigne une connexion administratrice ayant le droit `CREATEDB` ; sa valeur locale par défaut est `postgresql://task_manager@127.0.0.1:55412/postgres`. Avec Docker :

```sh
TEST_DATABASE_URL=postgresql://task_manager:local-development-only@127.0.0.1:55412/postgres npm test
TEST_DATABASE_URL=postgresql://task_manager:local-development-only@127.0.0.1:55412/postgres npm run e2e
```

Les tests couvrent les inscriptions et listes concurrentes, l’isolation entre comptes, les entrées invalides, la relecture réelle, les conflits de modification, une indisponibilité du stockage, la rotation et le rejeu des jetons, la révocation et les suppressions en cascade.

Les parcours navigateur emploient une autre base temporaire, une API sur le port 5012 et un client sur le port 4512, arrêtés en fin de test. Ils vérifient inscription, connexion, listes, tâches, profil, export, erreurs réseau, onglets concurrents, la navigation visiteur/compte, la déconnexion de deux onglets, le remplacement d’un compte pendant une ancienne création en attente sans rejeu sous le nouveau compte, et la date dans le fuseau Pacific/Auckland, la checklist rechargée, la copie modifiable, la semaine filtrée, une réponse perdue après création avec reprise unique, puis les vues 1440, 800, 390 et 320 px, les dialogues, la navigation, le clavier et les débordements. La CI exécute ces contrôles sur PostgreSQL réel. Pour compiler tout en conservant un serveur de développement ouvert, utilisez `NUXT_IGNORE_LOCK=1 NUXT_BUILD_DIR=.nuxt-build npm run build` : Nuxt écrit alors ses fichiers intermédiaires dans un dossier distinct.

## Limites actuelles

L’export JSON permet de lire ou conserver une copie des tâches ; l’import d’un export n’est pas disponible. Il n’y a pas de récurrence automatique, de partage de liste, de notification ni de récupération du mot de passe par e-mail. Les checklists sont des étapes d’une tâche, sans échéance propre. Les brouillons des formulaires restent en mémoire jusqu’à leur fermeture et ne survivent pas au rechargement. Les changements métier ne sont pas diffusés en direct : les données se rechargent au retour dans l’onglet, lors de la vérification périodique ou en actualisant la page. Les versions empêchent les écrasements silencieux.

Le projet n’est pas déployé. Pour une exposition publique, configurer HTTPS, `NODE_ENV=production`, l’origine exacte du client, de nouveaux secrets et une base protégée. Les cookies deviennent alors Secure. La base locale du Compose et ses identifiants ne constituent pas une configuration de production.

Au 9 octobre 2026, `npm audit` signale **11 dépendances avec une sévérité haute et aucune critique**, provenant de deux avis sans correctif stable publié :

| Avis                                                                              | Version installée et chemin                                                 | Portée observée                                                                                                                  |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| [braces, récursion profonde](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)   | braces 3.0.3 ; Nuxt 4.6.0 → Nitro 2.13.4 → globby 16.2.4 → micromatch 4.0.8 | Traitement des motifs de fichiers dans l’outillage Nuxt. Aucun motif glob n’est fourni par les formulaires de l’application.     |
| [node-forge, vérification RSA](https://github.com/advisories/GHSA-86w9-cpqp-85rv) | node-forge 1.4.0 ; Nitro 2.13.4 → listhen 1.10.1                            | Génération de certificats dans l’outillage. Le serveur local emploie HTTP sur 127.0.0.1 et n’utilise pas cette génération HTTPS. |

Les avis officiels et le registre npm ne proposent toujours pas de version stable corrigée. Nuxt 4.6.0, Nitro 2.13.4 et listhen 1.10.1 sont conservés. Les versions de braces et node-forge restent celles du registre ; leurs numéros et l’audit ne sont pas modifiés pour masquer les avis.

`scripts/patch-dependencies.ts` applique deux mitigations locales après installation :

- braces refuse au-delà de 128 niveaux de profondeur avec une `SyntaxError` avant l’épuisement de la pile. Le parseur compte aussi les parenthèses et les trois parcours récursifs contrôlent les AST transmis directement. Les motifs usuels, échappements, citations et plages restent compatibles. Les motifs exceptionnellement profonds sont désormais refusés ; ce garde-fou ne limite pas toutes les autres formes de coût combinatoire.
- node-forge vérifie le nombre d’enfants de `DigestAlgorithm` et exige un paramètre NULL vide, en reprenant les contrôles des propositions amont [#1152](https://github.com/digitalbazaar/forge/pull/1152) et [#1157](https://github.com/digitalbazaar/forge/pull/1157). Les signatures SHA valides, avec ou sans NULL pour SHA-256, sont conservées. Les tests produisent des encodages invalides signés avec une clé de test : ils démontrent la différence de validation, sans prétendre reproduire une forge sans clé privée.

Les cinq fichiers modifiés, leurs versions et empreintes avant/après figurent dans `scripts/dependency-mitigations.json`. Toute autre version ou tout autre octet arrête le correctif avant écriture. Les tests reproduisent le débordement de pile de la bibliothèque d’origine avec une pile bornée, les validations RSA permissives et le refus après mitigation ; ils vérifient aussi la compatibilité et l’idempotence. Le postinstall racine, le client, la CI et Docker exécutent ces contrôles. Une installation avec `--ignore-scripts` exige `npm run patch:dependencies` avant toute utilisation de Nuxt. Ces mesures sont maintenues dans le dépôt et restent à retirer après une release officielle corrigée et vérifiée.

L’audit complet et `npm audit --omit=dev` restent tous deux à **11 hautes / 0 critiques** : Nuxt déclare cet outillage dans son arbre de dépendances. En revanche, `npm audit --omit=dev --workspace=backend` donne **0 avis** pour l’API NestJS. Le manifeste de l’artefact Nuxt compilé ne contient ni braces ni node-forge. Cette séparation et les usages décrits limitent les chemins exposés ; les mitigations locales traitent les défauts testés, tandis que les deux avis restent visibles dans l’installation du dépôt.

DevTools stable 3.4.2 utilise encore l’import par défaut de simple-git 3, supprimé par la [migration officielle v4](https://github.com/steveukx/git-js/blob/main/docs/RELEASE-NOTES-V4.md). `scripts/patch-devtools.ts` adapte uniquement cet import vers `simpleGit`, selon ce guide. `npm run patch:devtools` est appelé explicitement après `npm ci` (également par le postinstall client lorsque npm autorise ce cycle). Il vérifie les versions verrouillées, l’empreinte SHA256 du fichier original et celle du fichier déjà adapté ; tout changement inattendu interrompt l’installation. `npm run test:compat` charge réellement le module et teste les lectures de branche, révision et état employées par DevTools, ainsi que le refus d’un fichier altéré. simple-git 4.0.2 dépend lui-même d’argv-parser 2.0.1 : ce dernier n’a pas d’override distinct. Ce correctif maintenu dans le dépôt accompagne l’override simple-git ; il ne suffit pas de forcer une version hors plage. Les autres overrides retenus sont mysql2 3.24.5, deepmerge-ts 8.0.2 et esbuild 0.28.2. L’installation neuve, Prisma, migrations, types, compilations et parcours complets vérifient leur usage. `npm run audit:verified` affiche le rapport npm brut, vérifie les empreintes mitigées et n’accepte que ces deux identifiants d’avis et leur propagation dans l’arbre. Toute alerte supplémentaire, même de sévérité basse, bloque la CI. Les tests de régression précèdent ce contrôle ; **l’audit npm reste à 11 hautes et ne doit pas être présenté comme vierge**.

Les migrations suivent les guides [Nuxt 4](https://nuxt.com/docs/4.x/getting-started/upgrade), [Nuxt UI](https://ui.nuxt.com/docs/getting-started/installation/nuxt), [NestJS 12](https://docs.nestjs.com/migration-guide) et [Prisma 7](https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7). Prisma 8 était une préversion au moment de la migration et n’a pas été retenu.

## Conteneur de production

Le Dockerfile à la racine compile NestJS et génère le client Nuxt statique. L’image finale exécute seulement l’API compilée et les dépendances de production du workspace backend, sous un utilisateur sans privilèges. Elle sert aussi les routes du navigateur, les fichiers et les icônes locaux. L’API et le frontend partagent l’origine HTTPS ; `NUXT_PUBLIC_API_BASE_URL=/api` est intégré lors de la génération. Les scripts inline de démarrage Nuxt sont autorisés par leur empreinte SHA256 dans la politique CSP, sans autorisation générale des scripts inline.

```bash
docker build --target build -t mes-listes-de-taches-migrations .
docker run --rm --env-file .env.production mes-listes-de-taches-migrations npm run db:migrate
docker build -t mes-listes-de-taches .
docker run --rm -p 8012:8012 --env-file .env.production mes-listes-de-taches
```

Le fichier `.env.production`, privé et hors Git, fournit `DATABASE_URL` vers PostgreSQL durable, `JWT_SECRET` et `REFRESH_TOKEN_SECRET` distincts/aléatoires, `FRONTEND_URL=https://votre-domaine` sans chemin ni slash final et `NODE_ENV=production`. Les migrations doivent réussir avant le démarrage de la nouvelle version ; les deux migrations du dépôt sont additives dans la base dédiée, sans importer l’ancien service. Sauvegarder PostgreSQL séparément de l’image. `HOST=0.0.0.0`, `PORT=8012` et le dossier frontend sont déjà définis dans l’image. Le port peut être imposé par l’hébergeur. `TRUST_PROXY` vaut 0 par défaut ; 1 convient uniquement à un proxy maîtrisé qui réécrit les en-têtes entrants.

`GET /api/health` contrôle la vie du processus ; `GET /api/ready` exécute une requête PostgreSQL et retourne 503 si la base est indisponible. Le conteneur utilise cette route pour son healthcheck. La configuration refuse une origine HTTP en production et les cookies sont Secure/HttpOnly/SameSite=Lax. Une API et un client sur des sites distincts ne sont pas la configuration proposée.

La documentation Swagger est disponible en développement et désactivée dans l’image publique. Les icônes utilisées, y compris celles choisies dynamiquement, sont intégrées au client ; aucune requête vers Iconify n’est nécessaire.

Le conteneur ne représente pas un déploiement public déjà effectué. Restent à configurer l’hébergeur gratuit, PostgreSQL durable et ses sauvegardes/quotas, les secrets, les migrations et l’URL HTTPS. Les limites et pauses éventuelles d’un service gratuit ne sont pas une garantie de disponibilité permanente.

## Livraison gratuite proposée

La proposition `render.yaml` utilise un service Docker Free et PostgreSQL durable Neon Free externe. La démonstration utilise un service Render Free et un projet Neon Free dédiés, créés à Francfort. Les deux migrations sont appliquées sur PostgreSQL 15.19. Fournir une connexion dédiée avec TLS dans `DATABASE_URL`, appliquer les migrations depuis l’image cible `build` avant le lancement, puis renseigner les secrets `sync:false` et l’origine HTTPS exacte. Aucun PostgreSQL Render gratuit n’est prévu : il expire après 30 jours. Au 9 octobre 2026, Neon annonce [1 Go par projet Free](https://neon.com/blog/neon-free-plan-1-gb-per-project), 100 CU-heures mensuelles, avec mise en veille. Vérifier les quotas du compte réellement créé et conserver des exports PostgreSQL séparés ; la courte restauration instantanée n’est pas une sauvegarde à long terme.

Render partage [750 heures gratuites par mois entre les services du workspace](https://render.com/docs/free), met en veille après 15 minutes sans trafic et peut prendre environ une minute à redémarrer. Deux services constamment actifs dépassent ce quota commun. La proposition désactive les déploiements automatiques, conserve la branche reviewable `improve/public-2026-10` et utilise la readiness de la base comme sonde. La démonstration publique est déployée depuis cette branche. La connexion privée et les secrets sont configurés dans Render ; les parcours sont contrôlés sur l’URL HTTPS réelle. Les tests locaux et la CI restent complémentaires aux vérifications publiques.
