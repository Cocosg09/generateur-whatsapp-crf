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
  depuis le formulaire, mais reste éditable à la main ; un bandeau propose de
  resynchroniser si le texte a divergé du formulaire.
- **Historique** : les messages copiés/envoyés/imprimés sont conservés (les 50
  derniers), consultables, cherchables, rechargeables dans le formulaire.
- **Brouillon local** : le formulaire en cours est sauvegardé dans le
  navigateur (localStorage) pour éviter une perte de saisie en cas de
  rechargement accidentel de la page.
- **Export** : copie presse-papiers, envoi direct vers WhatsApp, impression /
  export PDF avec mise en page dédiée.
- **Accès protégé** par mot de passe partagé (cookie de session).

## Prérequis

- Node.js 20.9+ (Next.js 16)
- Une instance Redis (stockage de l'historique et des modèles)

## Variables d'environnement

À définir dans `.env.local` (voir `.env.local` existant en local, non
versionné) :

| Variable       | Description                                              |
| -------------- | --------------------------------------------------------- |
| `APP_PASSWORD` | Mot de passe partagé protégeant l'accès à l'application    |
| `REDIS_URL`    | URL de connexion Redis (historique + modèles)              |

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
  page.js                 # orchestration de l'état (postes, historique, modèles, message)
  components/              # composants UI (PosteCard, HistoriquePanel, ModelesPanel, MessageEditor)
  api/                      # routes API (login, historique, modeles) — persistance Redis
  login/                    # page de connexion
lib/
  dps.js                    # logique métier pure (extraction, génération/parsing du message)
  dps.test.js                # tests unitaires
proxy.js                     # protection par cookie de session (ex-middleware, Next.js 16)
```

## Déploiement

Déployé sur [Vercel](https://vercel.com). Penser à configurer `APP_PASSWORD`
et `REDIS_URL` dans les variables d'environnement du projet Vercel (Redis
externe, ex. Upstash).

## Limitations connues

- Authentification par mot de passe unique partagé (pas de comptes
  individuels).
- Le rechargement d'un message depuis l'historique repose sur un parsing par
  expressions régulières du texte final : un changement de format du message
  (émojis, libellés) peut casser ce parsing.
- Pas de gestion de concurrence avancée sur Redis : deux utilisateurs
  modifiant l'historique/les modèles au même moment peuvent, en théorie,
  écraser une écriture concurrente.
