# Suivi horaire

Application Next.js pour enregistrer ses heures de travail semaine par semaine et suivre ses trajets domicile-travail.

## Fonctionnalités

- **Compte utilisateur** : inscription et connexion par e-mail / mot de passe, données sauvegardées en base et accessibles depuis n'importe quel appareil.
- **Saisie hebdomadaire** : pour chaque jour de la semaine, saisie de l'heure de début et de fin du matin et de l'après-midi, avec calcul automatique du total de la journée et de la semaine.
- **Trajet du jour** : choix du moyen de transport (Vélib + Navette, Voiture, RER, Autre solution), avec point de départ, point d'arrivée, distance en km (pour la voiture), heures de départ/arrivée maison (avec durée de trajet calculée) et description libre (pour "autre").
- **Validation des horaires** : vérifie que les heures de fin sont après les heures de début et que l'après-midi ne commence pas avant la fin de la matinée, avec message d'erreur affiché en cas d'incohérence.
- **Vue calendrier** : vue mensuelle type calendrier avec le total d'heures, le temps de trajet et le moyen de transport de chaque jour, et édition rapide au clic.
- **Statut du jour** : Travaillé, Congé (journée complète, matin ou après-midi) ou Jour férié, avec bascule en un clic pour la semaine entière en congés ; ces jours sont exclus du total d'heures travaillées et comptabilisés séparément.
- **Récapitulatif** : tableaux récapitulatifs semaine par semaine, vue mois et vue année, avec totaux, moyennes, jours de congé et temps de trajet cumulé.
- **Export Excel** : export des données (détail journalier + récap semaine + récap mois) en fichier `.xlsx`, pour toutes les années ou une année précise.
- **Paramètres** : option d'affichage des jours ouvrés uniquement (masquer samedi/dimanche) et changement du mot de passe du compte.

Les données sont stockées dans une base PostgreSQL, propres à chaque compte utilisateur.

## Développement local

1. Copier `.env.example` en `.env` et renseigner :
   - `NEON_POSTGRES_URL` / `NEON_POSTGRES_URL_NON_POOLING` : connexion vers une base PostgreSQL (locale ou distante).
   - `AUTH_SECRET` : une chaîne aléatoire (`openssl rand -base64 32`).
2. Appliquer le schéma à la base :
   ```bash
   npx prisma migrate dev
   ```
3. Lancer l'application :
   ```bash
   npm install
   npm run dev
   ```

Ouvrir [http://localhost:3000](http://localhost:3000) et créer un compte.

## Déploiement sur Vercel

1. Pousser ce dépôt sur GitHub (déjà fait si vous lisez ceci depuis le repo).
2. Aller sur [vercel.com/new](https://vercel.com/new) et importer le dépôt `suivi_horaire_work_hg`.
3. Dans l'onglet **Storage** du projet Vercel, créer/lier une base **Postgres (Neon)**, puis dans **Settings → Environment Variables**, ajouter `NEON_POSTGRES_URL` (connexion poolée, utilisée par l'application) et `NEON_POSTGRES_URL_NON_POOLING` (connexion directe, utilisée pour les migrations) à partir des valeurs fournies par l'intégration. **Important** : vérifiez que ces deux variables sont bien cochées pour l'environnement **Production** (pas seulement Preview/Development) — sinon le build échoue avec une erreur `Environment variable not found`.
4. Dans **Settings → Environment Variables**, ajouter `AUTH_SECRET` avec une valeur aléatoire (`openssl rand -base64 32`).
5. Cliquer sur **Deploy**. Le schéma de base de données est appliqué automatiquement à chaque déploiement (`prisma migrate deploy` fait partie de la commande de build).

À chaque nouveau push sur la branche principale, Vercel redéploie automatiquement l'application.

### Migration des données existantes (localStorage)

Si vous utilisiez une version précédente de l'application (sans compte, données en `localStorage`), la première connexion après création d'un compte importe automatiquement ces données dans votre nouveau compte, puis les efface du navigateur.

## Stack technique

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com)
- [Zustand](https://github.com/pmndrs/zustand) (état côté client, synchronisé avec le serveur)
- [Prisma](https://www.prisma.io) + PostgreSQL (persistance des comptes et des données)
- Sessions par cookie signé ([jose](https://github.com/panva/jose)) + mots de passe hachés ([bcryptjs](https://github.com/dcodeIO/bcrypt.js))
- [date-fns](https://date-fns.org) (calculs de dates, locale française)
- [ExcelJS](https://github.com/exceljs/exceljs) (génération du fichier d'export `.xlsx`)
