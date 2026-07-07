# Suivi horaire

Application Next.js pour enregistrer ses heures de travail semaine par semaine et suivre ses trajets domicile-travail.

## Fonctionnalités

- **Saisie hebdomadaire** : pour chaque jour de la semaine, saisie de l'heure de début et de fin du matin et de l'après-midi, avec calcul automatique du total de la journée et de la semaine.
- **Trajet du jour** : choix du moyen de transport (Vélib + Navette, Voiture, RER, Autre solution), avec point de départ, point d'arrivée, distance en km (pour la voiture) et description libre (pour "autre").
- **Vue calendrier** : vue mensuelle type calendrier avec le total d'heures et le moyen de transport de chaque jour, et édition rapide au clic.
- **Récapitulatif** : tableaux récapitulatifs semaine par semaine, vue mois et vue année, avec totaux et moyennes.
- **Export Excel** : export des données (détail journalier + récap semaine + récap mois) en fichier `.xlsx`, pour toutes les années ou une année précise.

Les données sont stockées localement dans le navigateur (`localStorage`), il n'y a donc aucune base de données ni configuration à faire pour déployer l'application.

## Développement local

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Déploiement sur Vercel

1. Pousser ce dépôt sur GitHub (déjà fait si vous lisez ceci depuis le repo).
2. Aller sur [vercel.com/new](https://vercel.com/new) et importer le dépôt `suivi_horaire_work_hg`.
3. Vercel détecte automatiquement Next.js : aucune variable d'environnement ni configuration supplémentaire n'est nécessaire.
4. Cliquer sur **Deploy**.

À chaque nouveau push sur la branche principale, Vercel redéploie automatiquement l'application.

## Stack technique

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com)
- [Zustand](https://github.com/pmndrs/zustand) (état + persistance `localStorage`)
- [date-fns](https://date-fns.org) (calculs de dates, locale française)
- [ExcelJS](https://github.com/exceljs/exceljs) (génération du fichier d'export `.xlsx`)
