# SpotBulle IA

Bienvenue sur le dépôt GitHub de SpotBulle IA. Ce projet est une plateforme de partage de vidéos d'événements, conçue avec une architecture moderne séparant le frontend (interface utilisateur) et le backend (API).

## Architecture du Projet

SpotBulle IA est composé de deux parties principales :

1.  **Frontend (Interface Utilisateur) :**
    *   **Description :** C'est l'application web avec laquelle les utilisateurs interagissent directement. Elle gère l'affichage des pages, la navigation, les formulaires de connexion/inscription, le téléchargement de vidéos, etc.
    *   **URL d'accès :** [https://spotbulle-ia.vercel.app/login](https://spotbulle-ia.vercel.app/login)
    *   **Déploiement :** Cette partie est déployée sur Vercel.

2.  **Backend (API) :**
    *   **Description :** Il s'agit du service d'API qui gère la logique métier, la gestion des utilisateurs, des événements, des vidéos, et l'interaction avec la base de données. Il fournit les données nécessaires au frontend.
    *   **URL d'accès :** [https://spotbulle-ia.onrender.com](https://spotbulle-ia.onrender.com)
    *   **Note importante :** Cette URL est un point d'accès API et n'est pas conçue pour être visitée directement par les utilisateurs finaux via un navigateur web. Accéder à cette URL affichera une réponse JSON décrivant les points d'accès de l'API, ce qui est un comportement normal pour un service backend.
    *   **Déploiement :** Cette partie est déployée sur Render.

## Comment ça marche ?

Le frontend (déployé sur Vercel) communique avec le backend (déployé sur Render) via des requêtes API. Lorsque vous utilisez l'application SpotBulle IA via l'URL Vercel, toutes les interactions nécessitant des données ou des opérations côté serveur sont gérées par le backend.

## Liens Utiles

*   **Application Frontend :** [https://spotbulle-ia.vercel.app/login](https://spotbulle-ia.vercel.app/login)
*   **Dépôt GitHub (ce dépôt) :** [https://github.com/basamba1990/spotbulle-ia](https://github.com/basamba1990/spotbulle-ia)

Pour toute question ou contribution, n'hésitez pas à consulter les issues ou à nous contacter.


