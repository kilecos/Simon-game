const buttonColours = ["red", "blue", "green", "yellow"];  // Les couleurs des boutons
let gamePattern = [];        // Les couleurs qui seront choisies aléatoirement par le jeu et qui seront mis à la suite les unes des autres
let userClickedPattern = []; // Les couleurs qui seront sélectionnées par le joueur et qui seront mis à la suite les unes des autres
let started = false;         // On défini le jeu comme non démarré
let level = 0;               // On défini le niveau à l'ouverture de la page qui sera incrémenté au lancement
let endGame = false;         // On défini une variable pour bloquer les clics pendant l'animation de fin pour ne pas relancer tout de suite si le joueur clique plusieurs fois d'affilée
let bestScore = localStorage.getItem("simonBestScore") || 0;  // On défini le meilleur score du joueur s'il y en a un

$("#best-score").text("Best Score : Level " + bestScore);  // On met à jour le texte selon le meilleur score du joueur

// Gestion du bouton Reset
$("#reset-btn").on("click touchstart", function(e) {
    e.stopPropagation();     // Si le joueur est sur mobile, on empêche le jeu de se déclencher à cause de la propagation d'évènement lors du touché du bouton RESET
    e.preventDefault();

    $("#modal-confirm").fadeIn(200).css("display", "flex");   // On fait apparaitre la fenêtre de confirmation de reset de score

});

$("#btn-no").on("click", function() {      // Quand le joueur clic sur le bouton NO

    $("#modal-confirm").fadeOut(200);      // On ferme simplement la fenêtre de confirmation

});

$("#btn-yes").on("click", function() {             // Quand le joueur clic sur le bouton YES

    localStorage.removeItem("simonBestScore");                   // On efface le score enregistré
    bestScore = 0;                                               // On le remet à 0             
    $("#best-score").text("Best Score : Level " + bestScore);    // On affiche le texte de score mis à jour
    $("#modal-confirm").fadeOut(200);                            // On ferme la fenêtre de confirmation

});

 // Modification du titre si l'utilisateur est sur appareil mobile
if ('ontouchstart' in window) {                          
    $("#level-title").text("Touch the Screen to Start");
}

// Définition de la fonction de lancement du jeu
function handleStart () {
    if(!started) {
        $("#level-title").text("Level " + level);       // On affiche le niveau du jeu, initialement 0, qui passera à 1 au lancement du jeu
        $("#best-score").text("Best Score : Level " + bestScore);
        nextSequence();
        started = true;
    }
}

// Début du jeu lors de la pression d'une touche du clavier ou touché de l'écran si sur appareil mobile
$(document).on("keydown touchstart", function(e) {

    // Si le joueur à perdu, on bloque tout
    if (endGame) {
        return;
    }

    if ($(e.target).is("button") || $(e.target).closest("button").length > 0) {   // On vérfie que la cible n'est pas un bouton ou à un lien avec un bouton pour ne pas lancer le jeu par erreur
        return;
    }
    handleStart();                     // On lance le jeu
});

// Ce qu'il se passe lors du clic du joueur sur l'un des boutons
$(".btn").on("click", function(){

    // Si le joueur à perdu, on bloque tout
    if (endGame) {
        return;
    }

    // Si le jeu n'a pas encore commencé (Game Over ou première partie)
    if (!started) {
        handleStart();  // On lance de le jeu
        return;         // Important pour ne pas enregistrer le premier clic comme une erreur
    }

    let userChosenColour = $(this).attr("id");  // On identifie le bouton cliqué

    userClickedPattern.push(userChosenColour);  // On ajoute ce bouton à l'ensemble des couleurs auparavant sélectionnées par le joueur

    playSound(userChosenColour);  // On joue le son correspondant à la couleur cliquée

    animatePress(userChosenColour); // On anime le bouton lors du clic

    checkAnswer(userClickedPattern.length - 1); // On vérifie si la couleur sélectionnée est la bonne

});

// Définition de la fonction de vérification des réponses du joueur
function checkAnswer(currentLevel) {

    if (userClickedPattern[currentLevel] === gamePattern[currentLevel]) {  // On compare les sélections du joueur par rapport à celles du jeu

        // Si cela est correct on enchaine sur le niveau suivant
        if (userClickedPattern.length === gamePattern.length) {            
            setTimeout(function() {     // On établi un délai de 1 seconde avant que le jeu enchaine sur le niveau suivant
                nextSequence();
            }, 1000);
        }
    // Si incorrect, on affiche le message de fin de jeu avec une animation sur le body du site et on invite le joueur à relancer une partie
    } else {                                                              

        playSound("wrong");         // On joue le son propre à une erreur

        $("body").addClass("game-over");  // On ajouter la classe game-over au body pour changé sur apparence

        endGame = true;      // On active le verrou pour ne plus prendre de clics en compte

        setTimeout(function() {                 // On défini un délai avant d'enlever cette classe
            $("body").removeClass("game-over");
        }, 200);

        let currentScore = level - 1;          // On prend le dernier niveau complété avec succès

        if (currentScore > bestScore) {       // On compare si la partie actuelle à eu un meilleur résultat que le meilleur score enregistré
            bestScore = currentScore;         // Si c'est le cas on remplace le meilleur score
            localStorage.setItem("simonBestScore", bestScore);         // On enregistre ce nouveau meilleur score
            $("#best-score").text("New Record ! Level " + bestScore);  // On annonce au joueur qu'il a battu son record
        }

        if ('ontouchstart' in window) {
            $("#level-title").text("Game Over !");     // On affiche le message de game over
        } else {
            $("#level-title").text("Game Over !");    
        }

        // On défini la durée de blocage (1s) avant de pouvoir relancer le jeu
        setTimeout(function() {
            if ('ontouchstart' in window) {
                $("#level-title").text("Game Over ! Touch the Screen to Restart");    // On affiche le message indiquant que le joueur peut relancer une partie
        } else {
                $("#level-title").text("Game Over ! Press Any Key to Restart");    
        }
        startOver();            // On appelle la fonction qui débute une nouvelle partie
        endGame = false;        // On désactive le verrou, le joueur peut relancer une partie
        }, 1000);
                
    }

}

// Réinitialisation du jeu pour lancer ensuite une nouvelle partie
function startOver() {
    level = 0;
    gamePattern = [];
    started = false;
}

// Fonctionnement du jeu
function nextSequence() {

    userClickedPattern = [];    // Réinitialisation de la liste de couleurs choisies par le joueur

    level++;   // On incrémente le niveau pour pouvoir l'afficher en tant que titre de la page

    $("#level-title").text("Level " + level);   // On change le titre pour qu'il corresponde au niveau actuel du jeu

    let randomNumber = Math.floor(Math.random() * 4);  // On génère un nombre aléatoire entre 0 et 3

    let randomChosenColor = buttonColours[randomNumber];  // On fait correspondre ce nombre à une des couleurs listées à la ligne 1

    gamePattern.push(randomChosenColor);  // On rajoute cette couleur à la liste de couleurs sélectionnées par le jeu

    $("#" + randomChosenColor).fadeIn(100).fadeOut(100).fadeIn(100);  // On met une animation pour bien distinguer la couleur choisie par le jeu

    playSound(randomChosenColor);  // On joue le son correspondant à la couleur choisie par le jeu

}

// Définition de la fonction afin de jouer les sons propres à chaque boutons
function playSound(name) {

    let audio = new Audio("./sounds/" + name + ".mp3");  // On va chercher le fichier audio à jouer correspondant à la couleur choisie
    audio.play();                // On joue le son sélectionné
    audio.volume = 0.15;         // On ajuste le volume de l'audio

}

// Définition de la fonction pour le rendu visuel des boutons lorsqu'ils sont cliqués
function animatePress(currentColour) {

    $("#" + currentColour).addClass("pressed");           // On ajoute la classe "pressed" au bouton sélectionné par le joueur pour lui donner l'aspect propre de cette dernière

    setTimeout(function() {
        $("#" + currentColour).removeClass("pressed");    // On retire la classe "pressed" après un délai de 100ms 
    }, 100);

}