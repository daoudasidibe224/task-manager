# Mes listes de tâches

Un agenda privé pour organiser ses tâches par liste, choisir une priorité et garder les échéances visibles. L’application propose une vue d’ensemble, les tâches du jour, les retards et les tâches terminées. L’affichage en tableau sépare les actions à faire des actions terminées.

Chaque compte possède ses propres listes. Les tâches peuvent être déplacées, annotées, terminées puis rouvertes. La recherche, le tri et l’export JSON utilisent les données du compte. La modification du profil et la suppression du compte sont disponibles dans le menu personnel.

## Installation locale

Prérequis : **Node.js 24.15 ou plus récent**, npm et PostgreSQL 15 ou plus récent. Docker Compose peut démarrer une base dédiée ; aucun compte cloud n’est nécessaire.

```sh
npm ci
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

Ouvrir **http://127.0.0.1:4312** et créer un compte. L’API écoute sur **http://127.0.0.1:8012/api**, sa documentation sur `/api/docs`. La base Docker utilise le port local **55412** et le volume `task_data`. Le mot de passe du conteneur est réservé au développement local. Avec un PostgreSQL déjà installé, adapter `DATABASE_URL` et créer une base vide avant la migration.

Le schéma initial remplace l’ancienne structure du projet. Ces migrations concernent une **nouvelle base dédiée** ; elles ne migrent pas les anciennes données. Arrêter Docker avec `docker compose stop` conserve les données. `docker compose down -v` efface le volume local.

## Architecture et stack

- Client : Nuxt 4, Vue 3, Nuxt UI 4, Tailwind CSS 4 et TypeScript strict. Archivo et les icônes sont servis localement ; la licence de la police est conservée dans `frontend/public/fonts/`.
- API : NestJS 12, PostgreSQL, Prisma 7 avec adaptateur `pg`, TypeScript strict et compilation ESM avec métadonnées de décorateurs.
- Métier : services séparés pour les comptes, sessions, listes et tâches ; contraintes uniques et suppressions en cascade dans PostgreSQL.
- Frontières : validation des entrées par DTO, rejet des champs inconnus, réponses contrôlées par Zod dans le client. Une échéance choisie est enregistrée à midi UTC et affichée en UTC pour préserver la date saisie dans les autres fuseaux.

L’authentification utilise des cookies HttpOnly et SameSite. Les mots de passe sont hachés avec bcrypt ; la limite de 72 octets est validée avant hachage. Chaque session conserve uniquement l’empreinte SHA-256 du jeton de renouvellement. La rotation possède un identifiant unique et vérifie atomiquement l’ancienne empreinte. La déconnexion révoque la session côté serveur, y compris un jeton d’accès copié ; les autres appareils restent connectés.

Les modifications de tâches, listes et profils portent leur version d’origine. Une modification concurrente est signalée sans écraser les données récentes, et le formulaire conserve sa saisie. Le client coordonne les renouvellements entre onglets avec Web Locks lorsque le navigateur le permet.

## Vérifications

```sh
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

Les parcours navigateur emploient une autre base temporaire, une API sur le port 5012 et un client sur le port 4512, arrêtés en fin de test. Ils vérifient inscription, connexion, listes, tâches, profil, export, erreurs réseau, onglets concurrents et la date dans le fuseau Pacific/Auckland, puis les vues 1440, 390 et 320 px, les dialogues, la navigation, le clavier et les débordements. La CI exécute ces contrôles sur PostgreSQL réel.

## Limites actuelles

L’export JSON permet de lire ou conserver une copie des tâches ; l’import d’un export n’est pas disponible. Il n’y a pas de partage de liste, de notification ni de récupération du mot de passe par e-mail. Les onglets ne synchronisent pas les changements en direct : actualiser la page recharge les données, et les versions empêchent les écrasements silencieux.

Le projet n’est pas déployé. Pour une exposition publique, configurer HTTPS, `NODE_ENV=production`, l’origine exacte du client, de nouveaux secrets et une base protégée. Les cookies deviennent alors Secure. La base locale du Compose et ses identifiants ne constituent pas une configuration de production.

Au 8 octobre 2026, `npm audit` signale **11 dépendances avec une sévérité haute et aucune critique**, provenant de deux avis sans correctif stable publié :

| Avis | Version installée et chemin | Portée observée |
| --- | --- | --- |
| [braces, récursion profonde](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) | braces 3.0.3 ; Nuxt 4.6.0 → Nitro 2.13.4 → globby 16.2.4 → micromatch 4.0.8 | Traitement des motifs de fichiers dans l’outillage Nuxt. Aucun motif glob n’est fourni par les formulaires de l’application. |
| [node-forge, vérification RSA](https://github.com/advisories/GHSA-86w9-cpqp-85rv) | node-forge 1.4.0 ; Nitro 2.13.4 → listhen 1.10.1 | Génération de certificats dans l’outillage. Le serveur local emploie HTTP sur 127.0.0.1 et n’utilise pas cette génération HTTPS. |

Les avis officiels indiquent l’absence de version corrigée. Le registre npm donne ces versions comme dernières stables, ainsi que Nitro 2.13.4 et listhen 1.10.1. Désactiver DevTools ne retire pas ces dépendances de Nuxt. Un retour à une version plus ancienne ne fournit pas de correctif identifié ; aucun remplacement incompatible ni préversion n’est installé pour modifier le résultat de l’audit.

L’audit complet et `npm audit --omit=dev` restent tous deux à **11 hautes / 0 critiques** : Nuxt déclare cet outillage dans son arbre de dépendances. En revanche, `npm audit --omit=dev --workspace=backend` donne **0 avis** pour l’API NestJS. Le manifeste de l’artefact Nuxt compilé ne contient ni braces ni node-forge. Cette séparation et les usages décrits limitent les chemins exposés ; elles ne résolvent pas les deux avis dans l’installation du dépôt.

Les `overrides` vers simple-git 4.0.2, @simple-git/argv-parser 2.0.1, mysql2 3.24.5, deepmerge-ts 8.0.2 et esbuild 0.28.2 corrigent les autres avis connus. Leur compatibilité a été vérifiée par une installation neuve, génération Prisma, migrations, types, compilations et parcours complets. La CI bloque les avis critiques, tout en affichant la limite haute restante ; **l’audit ne doit pas être présenté comme vierge**.

Les migrations suivent les guides [Nuxt 4](https://nuxt.com/docs/4.x/getting-started/upgrade), [Nuxt UI](https://ui.nuxt.com/docs/getting-started/installation/nuxt), [NestJS 12](https://docs.nestjs.com/migration-guide) et [Prisma 7](https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7). Prisma 8 était une préversion au moment de la migration et n’a pas été retenu.
