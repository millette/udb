# "UDB?" you might ask?

Démo de session (*user login*) en utilisant couchdb comme *backend*
et sa base de données spéciale ```_users``` ainsi que nginx comme proxy
pour ne configurer https qu'à un seul endroit, dans nginx, au lieu
de devoir aussi configurer https dans CouchDB et dans nginx.

On dépend de deux polyfills, fetch() et Promise() qui sont
déjà implémenter dans les fureteurs populaires.

CouchDB doit être configurer *out of the box* puis en créant au moins
un administrateur, pour sortir du mode *admin party*. Il ne devrait
écouter que sur localhost et non sur le réseau public.

Côté nginx, une fois https configuré sur un sous-domaine,
ajoutez un section comme

```
location /api/ {
  proxy_pass http://localhost:5984/;
  proxy_redirect off;
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

La page web devrait afficher deux formulaires:

* Register
* Login

Il n'y a probablement pas de user, alors on commence par Register.

Une fois complétée (un nom d'utilisateur nouveau, un password bien répété,
mais notez qu'on ne vérifie pas le email pour les doublons), les deux
formulaires Register et Login devraient disparaitre et être remplacé par
l'info sur l'utilisateur et un bouton logout.

Le bouton logout va remplacer à son tour les infos du user par les
formulaires Register et Login.

Si on change l'URL et qu'on ajoute #allo et qu'on recharge,
le hash **allo** sera stocké dans la DB avec le *user*.

Si on retourne à la page d'accueil, sans hash, on devrait toujours voir
le champ "hash" et la valeur **allo**. Si on se déplace vers #bonjour
(et qu'on recharge), le champ "hash" sera mis à jour.

Voilà pour la démo.

## TODO
* Afficher des messages à l'utilisateur (mauvais password, email existant, etc.)
* Vérifier email (confirmation par email et pour doublons dans la db)
* Utiliser les rôles CouchDB pour controler les utilisateurs qui peuvent utiliser le site
* Integrer au vrai site; grosso moder tracker le hash pis that's it :-)