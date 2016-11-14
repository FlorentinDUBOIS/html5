# HTML 5 API

Site réalisé par Florentin Dubois et Guy-Yann Morvan

## Pré-requis

L'utilisation d'un serveur est recommandé mais non obligatoire.

- Dans le cas où il n'y a pas de serveur, mettre les sources dans le répertoire de son choix et ouvrir dans un navigateur le fichier index.html.
- Dans le cas où il y a un serveur, mettre les sources dans le répertoire desservi par le serveur. Lancer le serveur. Accéder au site via l'adresse du serveur ([localhost](http://localhost) pour un serveur local).


## Environnement

Le site fonctionne sur tous les [navigateurs principaux](http://caniuse.com/usage-table) (sauf Internet Exploreur).

Pour les navigateurs ayant comme moteur de rendu WebKit, il faut utiliser le drapeau "--allow-file-access-from-files" au démarage du navigateur. Par exemple :

- Google Chrome
- Chromium
- Opera
- Safari

## Usage

Autoriser l'utilisation de la caméra, la position GPS et les notifications.

Le bouton "SHOOT" permet de prendre une photo. La position GPS et la date vont être affiché en dessous de la photo.

Une fois la photo prise, les boutons "SAVE" et "RESET" se débloquent.

Le bouton "SAVE" permet de sauvegarder la photo dans indexedDB et en local. Les photos enregistrées sont affichées sur la carte, à l'endroit où elles ont été prises. On peut également cliquer sur celles-ci afin de les révéler.

Le bouton "RESET" permet de réinitialiser l'affichage de la photo.

