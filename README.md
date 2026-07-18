# Générateur de message DPS — Croix-Rouge française

Application web pour préparer et diffuser rapidement le message WhatsApp de
briefing d'un Dispositif Prévisionnel de Secours (DPS) : postes, horaires,
intervenants, matériel, véhicules — avec historique, modèles réutilisables et
export PDF.

## Fonctionnalités

- **Gestion multi-poste** : ajout, suppression, duplication et réordonnancement
  (↑/↓) des postes d'un même dispositif.
- **Extraction automatique** : collez un tableau (qualifications /
  intervenants / horaires) et l'application propose une extraction du nom du
  poste, des horaires et des intervenants, à confirmer avant application.
- **Intervenants** : rôle, nom, statut conducteur (VL ou VPSP).
- **Modèles réutilisables** : enregistrez les infos récurrentes d'un poste
  (RDV, lieu, contacts, véhicule) sous un nom, rechargez-les ou mettez-les à
  jour en ré-enregistrant sous le même nom.
- **Message final éditable en direct** : le message est généré automatiquement
  depuis le formulaire (les champs non remplis sont omis), mais reste éditable
  à la main ; un bandeau propose de resynchroniser si le texte a divergé du
  formulaire. La zone de texte s'agrandit automatiquement avec le contenu.
- **Historique** : les messages copiés/envoyés/imprimés sont conservés (les 50
  derniers), consultables, cherchables, rechargeables dans le formulaire.
- **Brouillon local** : le formulaire en cours est sauvegardé dans le
  navigateur (localStorage) pour éviter une perte de saisie en cas de
  rechargement accidentel de la page.
- **Import d'un ordre de mission PDF** : depuis une popup accessible dans le
  header, chargez un PDF Croix-Rouge ; l'appli détecte les postes, horaires,
  lieux et intervenants pour pré-remplir le formulaire (à confirmer avant
  application).
- **Export** : copie presse-papiers, envoi direct vers WhatsApp, impression /
  export PDF avec mise en page dédiée.
- **Mise en page adaptative** : colonne unique sur petit écran, deux colonnes
  (formulaire + message) avec colonne message collante à partir de 1024px de
  large.
- **Comptes individuels et rôles** : chaque utilisateur a son propre
  identifiant/mot de passe ; un rôle `admin` gère les comptes et l'accès par
  fonctionnalité (postes, historique, modèles) des comptes `user` depuis une
  page `/admin`.

## Prérequis

- Node.js 20.9+ (Next.js 16)
- Une instance Redis (stockage de l'historique et des modèles)

## Variables d'environnement

À définir dans `.env.local` (voir `.env.local` existant en local, non
versionné) :

| Variable                  | Description                                                                 |
| ------------------------- | ----------------------------------------------------------------------------- |
| `SESSION_SECRET`          | Clé secrète (chaîne aléatoire longue) signant les cookies de session (HMAC)    |
| `INITIAL_ADMIN_USERNAME`  | Identifiant du compte admin créé automatiquement au premier login              |
| `INITIAL_ADMIN_PASSWORD`  | Mot de passe de ce compte admin (à changer/retirer une fois le compte créé)    |
| `REDIS_URL`               | URL de connexion Redis (utilisateurs, historique, modèles)                     |

Le tout premier login avec `INITIAL_ADMIN_USERNAME`/`INITIAL_ADMIN_PASSWORD`
crée le compte admin correspondant dans Redis (idempotent : les logins
suivants passent par la vérification normale). Une fois ce compte créé,
d'autres comptes (admin ou utilisateur avec accès restreint par
fonctionnalité) se créent depuis `/admin`.

## Installation et développement

```bash
npm install
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev     # serveur de développement
npm run build   # build de production
npm run start   # démarrage en production
npm run lint    # ESLint
npm test        # tests unitaires (node:test) sur lib/dps.js
```

## Structure du projet

```
app/
  page.js                   # orchestration de l'état (postes, historique, modèles, message)
  layout.js                 # layout racine, polices, métadonnées, Speed Insights
  icon.js                   # favicon généré (Next.js metadata route)
  components/                # composants UI
    PosteCard.js               # formulaire d'un poste (horaires, intervenants, matériel, véhicule)
    MessageEditor.js            # message final éditable + resynchronisation
    HistoriquePanel.js          # liste/recherche/rechargement de l'historique
    ModelesPanel.js              # enregistrement/rechargement des modèles
    ImportOrdreMission.js         # import PDF, détection de postes (pdfjs-dist)
    styles.js                     # styles partagés (objets JS inline, sauf /login en Tailwind)
  api/                        # routes API — persistance Redis
    login/route.js               # authentification (rate limiting par IP, cookie de session signé)
    logout/route.js               # suppression du cookie de session
    me/route.js                    # identité/permissions de l'utilisateur courant
    historique/route.js           # CRUD historique (GET/POST/DELETE, permission requise)
    modeles/route.js               # CRUD modèles réutilisables (permission requise)
    admin/users/route.js           # liste/création de comptes (admin only)
    admin/users/[username]/route.js # édition/suppression d'un compte (admin only)
  login/page.js               # page de connexion (identifiant + mot de passe)
  admin/page.js                # page d'administration des comptes (redirige les non-admins)
  admin/components/UsersTable.js # UI de gestion des comptes
lib/
  dps.js                     # logique métier pure (extraction, génération/parsing du message)
  dps.test.js                 # tests unitaires (node:test)
  pdfLignes.js                # extraction de lignes de texte depuis un PDF (pdfjs-dist)
  auth-edge.js                 # signature/vérification de session (Web Crypto, compatible Edge)
  auth-node.js                  # hachage des mots de passe (bcryptjs, Node uniquement)
  users.js                       # CRUD utilisateurs Redis
  session-guard.js                # helpers de vérification de session/permissions pour les routes API
middleware.js                # vérifie le cookie de session signé (runtime Edge), transmet l'identité
.github/workflows/ci.yml     # lint + tests + build sur push/PR
```

## Intégration continue

Un workflow GitHub Actions (`.github/workflows/ci.yml`) tourne sur chaque push
et pull request vers `main` : `npm run lint`, `npm test`, puis `npm run
build`.

## Déploiement

Déployé sur [Vercel](https://vercel.com). Penser à configurer
`SESSION_SECRET`, `INITIAL_ADMIN_USERNAME`, `INITIAL_ADMIN_PASSWORD` et
`REDIS_URL` dans les variables d'environnement du projet Vercel (Redis
externe, ex. Upstash). Après le premier déploiement, se connecter une fois
avec le compte admin initial pour le matérialiser dans Redis, puis créer les
comptes de l'équipe depuis `/admin`.

## Limitations connues

- Les permissions par fonctionnalité sont embarquées dans le cookie de
  session signé (pas de lecture Redis à chaque requête) : un changement de
  permission par l'admin ne prend effet qu'à la prochaine connexion de
  l'utilisateur concerné.
- Le rechargement d'un message depuis l'historique repose sur un parsing par
  expressions régulières du texte final : un changement de format du message
  (émojis, libellés) peut casser ce parsing.
- Pas de gestion de concurrence avancée sur Redis : deux utilisateurs
  modifiant l'historique/les modèles au même moment peuvent, en théorie,
  écraser une écriture concurrente.
- Le rate limiting du login est stocké en mémoire du processus : en
  environnement serverless (Vercel), chaque instance a son propre compteur,
  ce qui affaiblit la protection contre le brute force (un stockage Redis
  serait plus robuste).
