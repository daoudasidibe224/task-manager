# État du projet

Mes listes de tâches : application publique pour organiser ses tâches privées par liste, priorité et échéance. Dépôt https://github.com/daoudasidibe224/mes-listes-de-taches, branche improve/public-2026-10, PR draft existante. Aucune fusion ni publication cloud. Répertoire local `task-manager` conservé pour les serveurs.

Nouvelle DA relue et acceptée : index gauche, feuille centrale, semaine latérale ; forêt, ivoire et citron. Marque mobile visible, descriptions sur deux lignes, actions de 44 px et navigation mobile dialog/inert/focus/Escape. L’ancienne composition est abandonnée.

Frontend et API TypeScript strict, validation des contrats aux frontières. Sessions durables/révocables, isolation des comptes, contrôles multi-onglets et anciennes réponses 401, idempotence des créations et conflits de modifications conservés. FEATURES.md décrit la matrice métier ; README.md contient installation, configuration, tests et limites.

## Validations acquises

Lint, types, compilation, 20 tests API PostgreSQL, 2 tests de compatibilité DevTools, 4 régressions de sécurité des dépendances et E2E Chromium passent. Les parcours publics/privés, formulaires, erreurs, navigation, clavier, rechargement, concurrence et vues de 1440/800/390/320 sont vérifiés. Captures finales relues. Le conteneur réel passe HTTPS local, cookies Secure, readiness, redémarrage et persistance ; icônes locales et tâche relue dans le navigateur. Les schémas render.yaml sont validés selon le schéma officiel.

Audit npm du dépôt : 11 hautes / 0 critique (braces/node-forge), défauts couverts par deux mitigations locales vérifiées (profondeur AST bornée ; nombre d’enfants ASN.1 et NULL vide), API production : 0 ; image finale : 0 avis sur 313 installations de packages (289 noms distincts). Le correctif DevTools 3.4.2 / simple-git 4.0.2 est explicite, verrouillé par versions/empreinte et testé ; argv-parser 2.0.1 est une dépendance native de simple-git 4. Il s’agit des avis npm, pas d’une analyse exhaustive du système d’exploitation. Image Node 24 Bookworm non-root.

## Livraison proposée et limites

render.yaml définit Docker Free, readiness réelle, secrets sync:false, auto-deploy désactivé. PostgreSQL durable Neon Free externe ; migrations manuelles avant démarrage, aucune base Render à expiration de 30 jours. Render partage 750 heures/mois et met en veille après 15 minutes ; deux services actifs en permanence dépassent ce quota. Les accès Render et aux bases, secrets, restrictions réseau, sauvegardes et l’URL publique restent à configurer. Aucun service ni base distante créé.

Aperçu maintenu : http://127.0.0.1:4312, bases locales persistantes. Les preuves détaillées, PID et historiques restent dans work/task-manager-state.md, work/task-manager-preview.json et work/logs du dossier de coordination. L’état de publication Git et les runs CI au SHA exact sont consignés dans le checkpoint de coordination.


## Mitigations vérifiées le 9 octobre 2026

Aucune release corrigée officielle disponible pour les deux avis. Les cinq fichiers exacts sont contrôlés avant toute écriture et après correctif. braces borne le parseur et les parcours récursifs à 128 niveaux ; node-forge refuse les enfants ASN.1 surnuméraires et les NULL non vides. Ces protections locales ne couvrent pas tous les coûts combinatoires possibles et ne remplacent pas une release amont.

Installation npm ci neuve isolée, postinstall, 4 régressions, 2 tests DevTools, lint, types, compilation, 20 tests API, E2E Chromium et construction Docker passent. HTTPS local de l’image, cookies sécurisés, readiness, redémarrage et persistance passent aussi. L’audit npm brut reste visible à 11 hautes ; le contrôle CI vérifie les empreintes et bloque tout autre avis. Les bases temporaires de vérification sont supprimées après les tests ; l’aperçu 4312, l’API 8012 et PostgreSQL 55412 restent actifs.
