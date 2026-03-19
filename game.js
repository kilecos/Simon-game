const buttonColours = ["red", "blue", "green", "yellow"];  // Les couleurs des boutons
// Déclaration de l'objet gameState centralisant l'état du jeu en tant que propriétés
const gameState = {
    gamePattern : [],           // Les couleurs qui seront choisies aléatoirement par le jeu et qui seront mis à la suite les unes des autres
    userClickedPattern : [],    // Les couleurs qui seront sélectionnées par le joueur et qui seront mis à la suite les unes des autres
    started : false,            // On défini le jeu comme non démarré
    level : 0,                  // On défini le niveau à l'ouverture de la page qui sera incrémenté au lancement
    isPlayingSequence : false,  // On défini le moment ou c'est au tour du jeu
    endGame : false,            // On défini une variable pour bloquer les clics pendant l'animation de fin pour ne pas relancer tout de suite si le joueur clique plusieurs fois d'affilée
    bestScore : localStorage.getItem("simonBestScore") || 0  // On défini le meilleur score du joueur s'il y en a un
};

// "ontouchstart" in window indique que l'on est sur support tactile
const isMobile = "ontouchstart" in window;

// Définition en constante de l'évènement à écouter selon le device mobile ou desktop
// Le but est de ne pas écouter "click" sur mobile à cause de son délai de 300ms
const interact = isMobile ? "touchend" : "click";

// Définition et pré-chargement des différents sons via Howler.js
// Howler.js gère automatiquement la compatibilité audio cross-plateform (Desktop et mobile)
const sounds = {
    red:    new Howl({ src: ["./sounds/red.mp3"],    volume: 0.15 }),
    blue:   new Howl({ src: ["./sounds/blue.mp3"],   volume: 0.15 }),
    green:  new Howl({ src: ["./sounds/green.mp3"],  volume: 0.15 }),
    yellow: new Howl({ src: ["./sounds/yellow.mp3"], volume: 0.15 }),
    wrong:  new Howl({ src: ["./sounds/wrong.mp3"],  volume: 0.15 })
};

// Définition de la fonction pour jouer les sons propres à chaque bouton
// Howler.js remplace new Audio() pour une meilleur compatibilité mobile
function playSound(name) {
    sounds[name].play();
}

// On met à jour le texte selon le meilleur score du joueur
$("#best-score").text("Record : Niveau " + gameState.bestScore);  

// On défini une fonction afin de bloquer le focus clavier à l'intérieur des fenêtre modales
function focusTrap (modalId) {
	$(modalId).on("keydown", function (e) {
		if (e.key === "Tab") {
            // On défini des variables renvoyant aux boutons contenus dans les modales
			let focusables = $(modalId).find("button");
			let first = focusables.first();
			let last = focusables.last();
            // On établi la navigation entre les boutons pour rester à l'intérieur de la fenêtre modale
			if ($(document.activeElement).is(first) && e.shiftKey) {
				last.focus();
				e.preventDefault();
			} else if ($(document.activeElement).is(last) && !e.shiftKey) {
				first.focus();
				e.preventDefault();
			}
		}
	});
}

// On initialise cette fonction pour nos 2 modales au chargement de la page
focusTrap("#modal-confirm");
focusTrap("#modal-rules");

// Gestion du bouton Reset avec l'ouverture de la fenêtre modale de confirmation de reset de score
$("#reset-btn").on(interact, function(e) {
    e.stopPropagation();     // Si le joueur est sur mobile, on empêche le jeu de se déclencher à cause de la propagation d'évènement lors du touché du bouton RESET

    $("#modal-confirm").fadeIn(200).css("display", "flex");   // On fait apparaitre la fenêtre de confirmation de reset de score
    $("#btn-no").focus();    // On focus le bouton "NON" à l'ouverture de la fenêtre lors de la navigation au clavier

});

// Quand le joueur clic sur le bouton NO
$("#btn-no").on("click", function() {

    $("#modal-confirm").fadeOut(200);      // On ferme simplement la fenêtre de confirmation

});

// Quand le joueur clic sur le bouton YES
$("#btn-yes").on("click", function() {

    localStorage.removeItem("simonBestScore");                   // On efface le score enregistré
    gameState.bestScore = 0;                                               // On le remet à 0             
    $("#best-score").text("Record : Niveau " + gameState.bestScore);    // On affiche le texte de score mis à jour
    $("#modal-confirm").fadeOut(200);                            // On ferme la fenêtre de confirmation

});

// Modification du titre si l'utilisateur est sur appareil mobile
if (isMobile) {                          
    $("#level-title").text("Touche ICI pour Commencer");
}


// Définition de la fonction de lancement du jeu
function handleStart () {
    if(!gameState.started) {
        $("#level-title").removeClass("anim-title");
        $("#level-title").text("Niveau " + gameState.level);       // On affiche le niveau du jeu, initialement 0, qui passera à 1 au lancement du jeu
        $("#best-score").text("Record : Niveau " + gameState.bestScore);
        nextSequence();
        gameState.started = true;
    }
}

// Début du jeu lors de la pression d'une touche du clavier
$(document).on("keydown", function(e) {

    // On exclu les touches Tab et Echap pour garder l'accessibilité de la sélection au clavier
    if (e.key !== "Tab" && e.key !== "Escape") {
		// Si le joueur à perdu, on bloque tout
	    if (gameState.endGame) {
			return;
		}
		handleStart();  // On lance le jeu
	}

    // Si l'on appuie sur Echap lorsqu'une modale est ouverte, celle-ci se ferme
    if (e.key === "Escape" && $("#modal-confirm").is(":visible")) {
        $("#modal-confirm").fadeOut(200);
    }

    if (e.key === "Escape" && $("#modal-rules").is(":visible")) {
        $("#modal-rules").fadeOut(200);
    }
    
});

// Début du jeu lors du toucher sur le titre
$("#level-title").on("touchend", function() {

    if (gameState.endGame) {
        return;
    }

    // Sur mobile, le contexte audio peut être suspendu par le navigateur par défaut
    // On force donc sa reprise dès le premier toucher pour garantir la lecture du premier son
    if (Howler.ctx && Howler.ctx.state === "suspended") {
        Howler.ctx.resume();
    }

    handleStart();
});

// Ce qu'il se passe lors du clic ou touché du joueur sur l'un des boutons
$(".btn").on(interact, function(){

    // Si c'est au tour du jeu, il ne se passe rien car les clics sont bloqué
    if (gameState.isPlayingSequence) {
        return;
    }

    // Si le joueur à perdu, on bloque tout
    if (gameState.endGame) {
        return;
    }

    // Si le jeu n'a pas encore commencé (Game Over ou première partie)
    if (!gameState.started) {
        if (isMobile) {
            return;
        } else {
            handleStart();  // On lance de le jeu
            return;         // Important pour ne pas enregistrer le premier clic comme une erreur 
        }
    }

    let userChosenColour = $(this).attr("id");  // On identifie le bouton cliqué

    gameState.userClickedPattern.push(userChosenColour);  // On ajoute ce bouton à l'ensemble des couleurs auparavant sélectionnées par le joueur

    playSound(userChosenColour);  // On joue le son correspondant à la couleur cliquée

    animatePress(userChosenColour); // On anime le bouton lors du clic

    checkAnswer(gameState.userClickedPattern.length - 1); // On vérifie si la couleur sélectionnée est la bonne

});

// Définition de la fonction de vérification des réponses du joueur
function checkAnswer(currentLevel) {

    // On compare les sélections du joueur par rapport à celles du jeu
    if (gameState.userClickedPattern[currentLevel] === gameState.gamePattern[currentLevel]) {  

        // On compare la longueur des séquences du jeu et du joueur
        if (gameState.userClickedPattern.length === gameState.gamePattern.length) {    
            gameState.isPlayingSequence = true;    // On empêche les clics supplémentaires lorsque la séquence est complétée
            setTimeout(function() {     // On établi un délai de 1 seconde avant que le jeu enchaine sur le niveau suivant
                nextSequence();         // On enchaine sur le niveau suivant
            }, 1000);
        }
    // Si incorrect, on affiche le message de fin de jeu avec une animation sur le body du site et on invite le joueur à relancer une partie
    } else {                                                              

        playSound("wrong");         // On joue le son propre à une erreur

        $("body").addClass("game-over");  // On ajouter la classe game-over au body pour changé sur apparence

        gameState.endGame = true;      // On active le verrou pour ne plus prendre de clics en compte

        setTimeout(function() {                 // On défini un délai avant d'enlever cette classe
            $("body").removeClass("game-over");
        }, 200);

        let currentScore = gameState.level - 1;          // On prend le dernier niveau complété avec succès

        if (currentScore > gameState.bestScore) {       // On compare si la partie actuelle à eu un meilleur résultat que le meilleur score enregistré
            gameState.bestScore = currentScore;         // Si c'est le cas on remplace le meilleur score
            localStorage.setItem("simonBestScore", gameState.bestScore);         // On enregistre ce nouveau meilleur score
            $("#best-score").text("Nouveau Record ! Niveau " + gameState.bestScore);  // On annonce au joueur qu'il a battu son record
        }

        $("#level-title").text("Game Over !");     // On affiche le message de game over

        // On défini la durée de blocage (1s) avant de pouvoir relancer le jeu
        setTimeout(function() {
            if (isMobile) {
                $("#level-title").text("Game Over ! Touche ICI pour Relancer");    // On affiche le message indiquant que le joueur peut relancer une partie
        } else {
                $("#level-title").text("Game Over ! Appuie sur une touche pour Relancer");    
        }
        $("#level-title").addClass("anim-title");
        startOver();            // On appelle la fonction qui débute une nouvelle partie
        gameState.endGame = false;        // On désactive le verrou, le joueur peut relancer une partie
        }, 1000);
                
    }

}

// Réinitialisation du jeu pour lancer ensuite une nouvelle partie
function startOver() {
    gameState.level = 0;
    gameState.gamePattern = [];
    gameState.started = false;
}

// On défini un tableau contenant les différents paliers de jeu et les vitesse de séquence correspondantes
// Il est organisé en ordre décroissant car nous utilisons la méthode find() qui va retourner le premier élément du tableau répondant à notre condition
const paliers = [
	{level : 20, speed : 250}, 
	{level : 15, speed : 300}, 
	{level : 10, speed : 350}, 
	{level : 5, speed : 400}, 
	{level : 0, speed : 450}
];	

// Définition de la fonction gameSpeed afin de pouvoir ajuster la vitesse du jeu en fonction du niveau
function gameSpeed () {
    // Définition du palier actuel par la méthode find()
    // find() va retourner le premier élément du tableau répondant à la condtion à l'intérieur de function (palier)
	let palierActuel = paliers.find(function (palier) {
        // La condition de notre find()
        // Retourne true ou false, si false on regarde l'élément suivant du tableau et si true find() s'arrête (on a trouvé notre élément)
		return gameState.level > palier.level;
	});
    // Return renvoie la vitesse correspondante au palier trouvé avec find()
	return palierActuel.speed;
}


// Fonctionnement du jeu
function nextSequence() {

    gameState.isPlayingSequence = true;  // On indique que le jeu est en train de jouer pour bloquer tous clics du joueur

    gameState.userClickedPattern = [];    // Réinitialisation de la liste de couleurs choisies par le joueur

    gameState.level++;   // On incrémente le niveau pour pouvoir l'afficher en tant que titre de la page

    $("#level-title").text("Niveau " + gameState.level);   // On change le titre pour qu'il corresponde au niveau actuel du jeu

    let randomNumber = Math.floor(Math.random() * 4);  // On génère un nombre aléatoire entre 0 et 3

    let randomChosenColor = buttonColours[randomNumber];  // On fait correspondre ce nombre à une des couleurs listées à la ligne 1

    gameState.gamePattern.push(randomChosenColor);  // On rajoute cette couleur à la liste de couleurs sélectionnées par le jeu

    let actualSpeed = gameSpeed();  // On défini la variable représentant le vitesse actuelle du jeu en fonction du niveau

    let animationTime = actualSpeed / 4;  // On défini la variable du temps d'animation des boutons pour qu'elle s'adapte à la vitesse du jeu

    // Pour chaque couleur de la séquence du jeu 
    gameState.gamePattern.forEach(function(color, index) {
        setTimeout(function() {
            // Si c'est la dernière couleur choisie (randomChosenColor)
            if (index === gameState.gamePattern.length - 1) {
                // On applique une animation sur le bouton sélectionné par le jeu pour le rendre visible
                $("#" + color).fadeIn(animationTime).fadeOut(animationTime).fadeIn(animationTime).promise().done(function() {
                    // On désactive l'état disant que c'est le tour du jeu pour de nouveau permettre les clics du joueur
                    gameState.isPlayingSequence = false;
                });
                // On joue le son correspondant à la couleur choisie
                playSound(color)
            // Si ce n'est pas la dernière couleur choisie
            } else {
                // On applique une animatin sur les boutons sélectionnés par le jeu
                $("#" + color).fadeIn(animationTime).fadeOut(animationTime).fadeIn(animationTime);
                // On joue le son correspondant aux couleurs
                playSound(color);
            }
            // Chaque couleur attend son tour, actualSpeed renvoi délai entre chaque couleur en fonction du niveau du jeu
        }, index * actualSpeed);
    });
}

// Définition de la fonction pour le rendu visuel des boutons lorsqu'ils sont cliqués
function animatePress(currentColour) {

    $("#" + currentColour).addClass("pressed");           // On ajoute la classe "pressed" au bouton sélectionné par le joueur pour lui donner l'aspect propre de cette dernière

    setTimeout(function() {
        $("#" + currentColour).removeClass("pressed");    // On retire la classe "pressed" après un délai de 100ms 
    }, 100);

}

// Ajout de la fonctionnalité d'ouverture d'une fenêtre modale contenant les règles du jeu
$("#rules-btn").on(interact, function(e) {
    e.stopPropagation();     // Si le joueur est sur mobile, on empêche le jeu de se déclencher à cause de la propagation d'évènement lors du touché du bouton "?"
    
    $("#modal-rules").fadeIn(200).css("display", "flex");   // On fait apparaitre la fenêtre des règles du jeu
    $(".box-rules").scrollTop(0);            // On remet la barre de scroll en position initiale si la fenêtre avait déjà été ouverte
    $("#btn-close-top").focus();             // On focus le bouton "X" à l'ouverture de la modale lors de la navigation au clavier
});

// Fermture de la fenêtre par clic sur l'un des deux boutons qu'elle contient
$("#btn-close-top, #btn-close-bottom").on("click", function() {
    $("#modal-rules").fadeOut(200);
});

// Fermeture des fenêtres modales par clic en dehors de celles-ci
$("#modal-rules, #modal-confirm").on('click', (e) => {
    if ($(e.target).is($("#modal-rules"))) {
        $("#modal-rules").fadeOut(200);
    }
    if ($(e.target).is($("#modal-confirm"))) {
        $("#modal-confirm").fadeOut(200);
    }
});

// On empêche le déclenchement du jeu lors de l'activation des boutons des modales et du lien dans le footer par les touches Entrée et Espace
$("#rules-btn, #reset-btn, a, #btn-close-top, #btn-close-bottom, #btn-yes, #btn-no").on("keydown", function (e) {
    // On exclu la touche Tab pour permettre à la fonction focusTrap de s'exécuter et la touche Echap pour pouvoir fermer les modales avec cette dernière
    if (e.key !== "Tab" && e.key !== "Escape") {
        e.stopPropagation();
    }
});