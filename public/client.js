$(document).ready(function(){

	// Dynamisch Spielelemente bauen
	var window_w=window.innerWidth
	|| document.documentElement.clientWidth
	|| document.body.clientWidth;

	var window_h=window.innerHeight
	|| document.documentElement.clientHeight
	|| document.body.clientHeight;
	
	var wXProz = Math.floor(window_w * 0.1)
	var svgNS = "http://www.w3.org/2000/svg";  

	var window_lowest_expansion = 0;
	var window_biggest_expansion = 0;
	var arena_lowest_expansion = 0;
	var arena_biggest_expansion = 0;
	var svg_rotate_val = 0;   // keine Rotation
	
	// die kleinste Seitenlaenge ist Basis zum malen
	if (window_w > window_h) {
		window_lowest_expansion = window_h;
		window_biggest_expansion = window_w;
	}
	else {
		window_lowest_expansion = window_w;
		window_biggest_expansion = window_h;
		svg_rotate_val = 90;   // rotieren
	}

	// *************************************************************
	// Spielvariablen erstellen
	// *************************************************************
	
	// groesse des spielfeldes siehe auch skalierung (suche nach element g und "scale")
	//var arena_width = window_lowest_expansion / 1.3;
	//var arena_heigth = window_lowest_expansion / 1.3;
	var arena_width = 900;
	var arena_heigth = 600;
	if (arena_width > arena_heigth) {
		arena_lowest_expansion = arena_heigth;
		arena_biggest_expansion = arena_width;
	}
	else {
		arena_lowest_expansion = arena_width;
		arena_biggest_expansion = arena_heigth;
	}
	
	var balken_width = arena_width - 40;
	var balken_heigth = 5;
	var tor_width = 2;
	var tor_heigth = arena_heigth;

	var schlaeger_width = 10;
	var schlaeger_heigth = 60;

	// Spielstaende
	var punkteR = 0;
	var punkteL = 0;
	
	var playerRole = '';
	playerRole = localStorage.getItem("playerrole");
	$('#name').val(playerRole);
	
	// *************************************************************
	// Objekte erstellen
	// *************************************************************
	var my_arena = new Arena(0, 0, arena_width, arena_heigth, "Arena1");

	//    f Ball(x, y, radius, id, speed, direction, color)
	var speedBallx_left = -3.5;
	var speedBallx_right = 3.5;
	var speedBally_up = -1;
	var speedBally_down = 1;
	var speedBallx_start = speedBallx_right;
	var speedBally_start = speedBally_down;
	var my_ball = new Ball(100, 100, 10, "Ball1", new Vector(speedBallx_right, speedBally_up), "black");
	var my_spL = new Schlaeger(10, 0, schlaeger_width, schlaeger_heigth,"LinkerSchlaeger", "blue", "moveblue");   // Schleaeger
	var my_spR = new Schlaeger(arena_width - schlaeger_width - 10, 0, schlaeger_width, schlaeger_heigth,"RechterSchlaeger", "red", "movered");   // Schleaeger
	var my_balkenO = new Wand(20, 5, balken_width, balken_heigth,"ObenBalken");   // Balken
	var my_balkenU = new Wand(20, arena_heigth - 10, balken_width, balken_heigth,"UntenBalken");   // Balken
     
	// tor linie rechts
	var my_torL = new Wand(0, 0, tor_width, tor_heigth,"LinksTor");   // Tor
	var my_torR = new Wand(arena_width - tor_width, 0, tor_width, tor_heigth,"RechtsTor");   // Tor

	// mittlerer senkrechte linie
	var my_lineM = new Gerade(arena_width / 2 , 5 , arena_width / 2, arena_heigth - 5,"MittlereLinie");   // Linie
	
	
	// WebSocket
	var socket = io.connect();
	// neue Nachricht
	
	// neue Positions Nachricht
	var client_name = $('#name').val();
	
	// der schlaeger darf momentan nicht fuer client name='l' gesetzt werden
	if (client_name != 'l') {
		socket.on('moveblue', function (data) {
			// nach unten scrollen
			console.log('client receive moveblue:' + data.posy);
			//$('rect1').setAttribute("y",data.posy);
			var rect = document.getElementById("LinkerSchlaeger");
			rect.setAttribute("y", data.posy);
			
			// Wert fuer object setzen
			my_spL.y = data.posy;
		});
	}
	// der schlaeger darf momentan nicht fuer client name='r' gesetzt werden
	if (client_name != 'r') {
		socket.on('movered', function (data) {
			// nach unten scrollen
			console.log('client receive move red:' + data.posy);
			var rect = document.getElementById("RechterSchlaeger");
			rect.setAttribute("y", data.posy);
			// Wert fuer object setzen
			my_spR.y = data.posy;
		});
	}
	
	// der ball darf momentan nicht fuer client name='b' gesetzt werden
	if (client_name == '' || client_name == 'l' || client_name == 'r') {
		socket.on('moveball', function (data) {
			// nach unten scrollen
			console.log('client receive move ball:' + data.posx + ", " + data.posy);
			var ball = document.getElementById("Ball1");
			ball.setAttribute("cx", data.posx);
			ball.setAttribute("cy", data.posy);
			my_ball.x = data.posx;
			my_ball.y = data.posy;

		});
	}
	
	
	

	function Point(x, y) {
		this.x = x;
		this.y = y;
	}

	function Vector(vx, vy) {
		this.x = vx;
		this.y = vy;
	}

	function Arena(x, y, w, h, id) {
		this.plo = new Point(x, y);  // Punkt links oben vom Rechteck
		this.w = w;   // Breite
		this.h = h;   // Hoehe
		this.id = id;
		this.plu = new Point(x, y + h);  // Punkt links unten vom Rechteck
		this.pro = new Point(x + w, y);  // Punkt rechts oben vom Rechteck
		this.pru = new Point(x + w, y + h);  // Punkt rechts unten vom Rechteck
	}
	
	function Ball(x, y, radius, id, speed, color) {
		this.x = x;
		this.y = y;
		this.r = radius;
		this.id = id;
		this.v = speed;       // Typ Vektor
		//this.d = direction;   // Typ Vektor
		this.c = color;
	}
	
	function Schlaeger(x, y, w, h, id, color, socketfunction) {
		this.x = x; 
		this.y = y; 
		this.w = w;   // Breite
		this.h = h;   // Hoehe
		this.id = id;
		this.s = 1;   // erst einmal vorbelegen
 		this.d = new Vector(0, 2);    // vom Typ Vektor
		this.c = color;
		this.socketfunction = socketfunction;
		
		// nicht nutzen, da beweglich
		/*
		this.plo = new Point(x, y);  // Punkt links oben vom Rechteck
		this.plu = new Point(x, y + h);  // Punkt links unten vom Rechteck
		this.pro = new Point(x + w, y);  // Punkt rechts oben vom Rechteck
		this.pru = new Point(x + w, y + h);  // Punkt rechts unten vom Rechteck
		*/
		
	}

	function Wand(x, y, w, h, id) {
		this.x = x; 
		this.y = y; 
		this.plo = new Point(x, y);  // Punkt links oben vom Rechteck
		this.w = w;   // Breite
		this.h = h;   // Hoehe
		this.id = id;
		this.plu = new Point(x, y + h);  // Punkt links unten vom Rechteck
		this.pro = new Point(x + w, y);  // Punkt rechts oben vom Rechteck
		this.pru = new Point(x + w, y + h);  // Punkt rechts unten vom Rechteck
	}

	function Gerade(x1, y1, x2, y2, id) {
		this.x1 = x1; 
		this.y1 = y1; 
		this.x2 = x2;   
		this.y2 = y2;   
		this.id = id;
	}

	var g;
	function changeRootElem() {
		var myRootSVG = document.getElementById("mySVG");
		//myRootSVG.setAttribute("height", arena_heigth + (arena_heigth / 10));
		//myRootSVG.setAttribute("width", arena_width + (arena_width / 10));
		
		var scale_fac = 1.0;
		if (window_w > window_h) {
			myRootSVG.setAttribute("height", (window_h / 2) + (window_h / 10));
			myRootSVG.setAttribute("width", (window_w));
			
			// keine Ahnung wie ich auf die Werte komme
			scale_fac = (window_w / (arena_width * 4));
		}
		else {
			// window_w < window_h
			// Fenster ist hoch und schmal
			// hoehe und breite tauschen
			myRootSVG.setAttribute("height", (window_w / 2) + (window_w / 4));
			myRootSVG.setAttribute("width", (window_h));
			scale_fac = (window_h / (arena_heigth * 3));
		}
		
		var svg_translate_val = 20;
		if (svg_rotate_val > 0) {
			svg_translate_val = arena_width - arena_width / 2;
		}
		
		var transf_strg = "translate(" + svg_translate_val.toString() + ") scale(" + scale_fac.toString() + ") rotate(" + svg_rotate_val.toString()  + ")";
		myRootSVG.setAttributeNS (null, 'transform', transf_strg);
	}

	function createGroupElem() {
			g = document.createElementNS (svgNS, "g");
			g.setAttributeNS(null,"id","mySVGgroup");
			// matrix beisp
			// http://tutorials.jenkov.com/svg/svg-transformation.html
            //g.setAttributeNS (null, 'transform', 'matrix(1,2,0,-1,0,300)');
     
			//g.setAttributeNS (null, 'transform', 'translate(20) scale(2)');
			//g.setAttributeNS (null, 'transform', 'translate(20) scale(1)');
			
			document.getElementById("mySVG").appendChild (g);
    }
	
	// Bildschirmanzeige DOM
	function createBall(x,y,r,myname)
	{
		var myCX = Math.floor(x);
		var myCY = Math.floor(y);
		var myR = Math.floor(r);
		
		var myCircle = document.createElementNS(svgNS,"circle"); //to create a circle, for rectangle use rectangle
		myCircle.setAttributeNS(null,"id",myname);
		myCircle.setAttributeNS(null,"cx",myCX);
		myCircle.setAttributeNS(null,"cy",myCY);
		myCircle.setAttributeNS(null,"r",myR);
		myCircle.setAttributeNS(null,"fill","black");
		myCircle.setAttributeNS(null,"stroke","none");

		document.getElementById("mySVGgroup").appendChild(myCircle);
	}      		

	function createRect(x,y,w,h,myname, myfill, mystroke)
	{
		var myX = Math.floor(x);
		var myY = Math.floor(y);
		var myW = Math.floor(w);
		var myH = Math.floor(h);
		
		var myRect = document.createElementNS(svgNS,"rect"); //to create a Arena, for rectangle use rectangle
		myRect.setAttributeNS(null,"id", myname);
		myRect.setAttributeNS(null, "x", myX);
		myRect.setAttributeNS(null, "y", myY);
		myRect.setAttributeNS(null, "width",  myW);
		myRect.setAttributeNS(null, "height", myH);

		myRect.setAttributeNS(null,"fill",myfill);
		myRect.setAttributeNS(null,"stroke",mystroke);

		document.getElementById("mySVGgroup").appendChild(myRect);
	}      		

	function createBalken(x,y,w,h,myname, myfill, mystroke)
	{
		var myX = Math.floor(x);
		var myY = Math.floor(y);
		var myW = Math.floor(w);
		var myH = Math.floor(h);
		
		var myRect = document.createElementNS(svgNS,"rect"); //to create a Arena, for rectangle use rectangle
		myRect.setAttributeNS(null,"id", myname);
		myRect.setAttributeNS(null, "x", myX);
		myRect.setAttributeNS(null, "y", myY);
		myRect.setAttributeNS(null, "width",  myW);
		myRect.setAttributeNS(null, "height", myH);

		myRect.setAttributeNS(null,"fill",myfill);
		myRect.setAttributeNS(null,"stroke",mystroke);

		document.getElementById("mySVGgroup").appendChild(myRect);
	}      		

	function createLinie(x1,y1,x2,y2,myname, mycolor, mystroke_width)
	{
  	    var myX1 = Math.floor(x1);
	    var myY1 = Math.floor(y1);
	    var myX2 = Math.floor(x2);
		var myY2 = Math.floor(y2);
		
		var aLine = document.createElementNS(svgNS, "line");
		aLine.setAttribute('x1', myX1);
		aLine.setAttribute('y1', myY1);
		aLine.setAttribute('x2', myX2);
		aLine.setAttribute('y2', myY2);
		aLine.setAttribute('stroke', mycolor);
		aLine.setAttribute('stroke-width', mystroke_width);
		aLine.setAttribute('stroke-dasharray', "10,10");
		
		document.getElementById("mySVGgroup").appendChild(aLine);
	}
	
	
	function createText(x, y, myname, textval)
	{
		var newText = document.createElementNS(svgNS,"text");
		newText.setAttributeNS(null,"x",x);     
		newText.setAttributeNS(null,"y",y); 
		newText.setAttribute("id", myname);
		newText.setAttributeNS(null,"font-size","40");
		newText.setAttributeNS(null,"font-weight","bold");
		newText.setAttributeNS(null,"fill","#999999");
		newText.setAttributeNS(null,"stroke","#000000");

		var textNode = document.createTextNode(textval);
		newText.appendChild(textNode);
		document.getElementById("mySVGgroup").appendChild(newText);
	}
	// *************************************************************
    
	// *************************************************************
	// Spielelemente zeichnen
	// *************************************************************
	
	// Root Elemet hoehe und Breite setzen
	changeRootElem();
	
	createGroupElem();
	// Spielfeldanzeige
	createText((arena_width / 2) - (arena_width / 7), 50 , "AnzeigefuerRechtenSpieler","0");
	createText((arena_width / 2) + (arena_width / 10), 50 ,"AnzeigefuerLinkenSpieler","0");

	createRect(my_arena.plo.x, my_arena.plo.y, my_arena.w, my_arena.h, my_arena.id,"none","black");
	createRect(my_spL.x, my_spL.y, my_spL.w, my_spL.h, my_spL.id, my_spL.c,"none");
	createRect(my_spR.x, my_spR.y, my_spR.w, my_spR.h, my_spR.id, my_spR.c,"none");
	createBall(my_ball.x, my_ball.y, my_ball.r, my_ball.id);
	createBalken(my_balkenO.plo.x, my_balkenO.plo.y, my_balkenO.w, my_balkenO.h, my_balkenO.id, "black","none");
	createBalken(my_balkenU.plo.x, my_balkenU.plo.y, my_balkenU.w, my_balkenU.h, my_balkenU.id, "black","none");

	createBalken(my_torL.plo.x, my_torL.plo.y, my_torL.w, my_torL.h, my_torL.id, "black","none");
	createBalken(my_torR.plo.x, my_torR.plo.y, my_torR.w, my_torR.h, my_torR.id, "black","none");
	createLinie(my_lineM.x1, my_lineM.y1, my_lineM.x2, my_lineM.y2, my_lineM.id, "black", 1);
	
	
	// *************************************************************
	
	// NNE	
    var timerFunctionBlue = null;
    var timerFunctionRot = null;
	var glob_directionBlue = 1;
	var glob_directionRed = 1;
    var glob_move_dist = 20;

	function moveBlauRunter(dist) {
		moveSchlaeger(1, my_spL, dist);
	}
	function moveBlauDown() {
		moveSchlaeger(1, my_spL, glob_move_dist);
	}

	function moveBlauHoch(dist) {
		moveSchlaeger(-1, my_spL, dist);
	}
	function moveBlauUp() {
		moveSchlaeger(-1, my_spL, glob_move_dist);
	}

	function moveRotRunter(dist) {
		moveSchlaeger(1, my_spR, dist);
	}
	function moveRotDown() {
		moveSchlaeger(1, my_spR, glob_move_dist);
	}

	function moveRotHoch(dist) {
		moveSchlaeger(-1, my_spR, dist);
	}
	function moveRotUp() {
		moveSchlaeger(-1, my_spR, glob_move_dist);
	}
	
	function moveSchlaeger(wishdirection, schlaeger, dist) {
		var oldX = parseInt(schlaeger.x);
		var oldY = parseInt(schlaeger.y);
		var oldW = parseInt(schlaeger.w);
		var oldH = parseInt(schlaeger.h);
		if (wishdirection > 0) {
			// direction 1 = runter
            glob_directionBlue = 1;
		}
		else {
            glob_directionBlue = -1;
		}
		
		// oberen rand pruefen
        if(oldY < parseInt(my_arena.plo.y)) {
			// direction 1 = runter
            glob_directionBlue = 1;
        }

		// unteren rand pruefen
        if((oldY + oldH) > parseInt(my_arena.plu.y)) {
		    // direction -1 = rauf
            glob_directionBlue = -1;
        }
        var newY = (glob_directionBlue * (dist)) + oldY;
	
        var rect = document.getElementById(schlaeger.id);
        rect.setAttribute("y", newY);
		schlaeger.y = parseInt(newY);   // wert fuer obj setzen
		
  	   // Eingabefelder auslesen
		var posy = newY.toString();
		// Socket senden
		var name = $('#name').val();
		// nur senden 'moveblue' wenn  name == sp1
		if (name == 'l' && schlaeger.socketfunction == 'moveblue') {
			console.log('sp1 sendet moveblue');
			socket.emit('moveblue', { posy: posy});
		}
		if (name == 'r'  && schlaeger.socketfunction == 'movered') {
			console.log('sp2 sendet movered');
			socket.emit('movered', { posy: posy});
		}
		//socket.emit(schlaeger.socketfunction, { posy: posy});
	
    }


	// bei einem Klick
	$('#sendenBlauHoch').click(moveBlauUp);
	$('#sendenBlauRunter').click(moveBlauDown);
	$('#sendenRotHoch').click(moveRotUp);
	$('#sendenRotRunter').click(moveRotDown);

	// oder mit der Enter-Taste
	$('#text').keypress(function (e) {
		if (e.which == 13) {
			senden();
		}
	});

	
	// Ball animation
	// 1 nach rechts; -1 nach links
	
	

    var timerFunction = null;
    var timerFunctionSpeed = null;

    function startAnimation() {
        if(timerFunction == null) {
			 // If you wanted to get between 100 and 400, you would put:

			my_ball.x = Math.floor(Math.random() * (arena_width - 200)) + 100;
			my_ball.y = Math.floor(Math.random() * (arena_heigth - 200)) + 100;
			my_ball.v.x = speedBallx_start;
	        my_ball.v.y = speedBally_start;

            timerFunction = setInterval(checkCollision, 50);
        }
		
        if(timerFunctionSpeed == null) {
            timerFunctionSpeed = setInterval(increaseSpeed, 5000);
        }
		
    }

    function stopAnimation() {
        if(timerFunction != null){
			play_single_sound_audio_shot_goal();
            clearInterval(timerFunction);
            timerFunction = null;
        }
        if(timerFunctionSpeed != null){
            clearInterval(timerFunctionSpeed);
            timerFunctionSpeed = null;
        }
    }

    function stopSpeedIncrease() {
        if(timerFunctionSpeed != null){
            clearInterval(timerFunctionSpeed);
            timerFunctionSpeed = null;
        }
    }

	// bei einem Klick
	$('#starteBall').click(startAnimation);
	
	function increaseSpeed() {
		my_ball.v.x = 1.3 * my_ball.v.x;
		my_ball.v.y = 1.3 * my_ball.v.y;
	}
	
	
    function checkCollision() {
		var dirXChange = false;
		var dirYChange = false;
		if (checkCollisionL(my_torL))  {
			// Ball faerben
			// Hupe
			// gegnerische Punkte erhoehen
			punkteL = punkteL + 1;
			var textForL = document.getElementById("AnzeigefuerLinkenSpieler");
			textForL.textContent = String(punkteL);
			stopAnimation();
			return;
		}

		if (checkCollisionR(my_torR)) {
			// Ball faerben
			// Hupe
			// gegnerische Punkte erhoehen
			punkteR = punkteR + 1;
			var textForR = document.getElementById("AnzeigefuerRechtenSpieler");
			textForR.textContent = String(punkteR);
			stopAnimation();
			return;
		}
		
		// Spieler pruefen
		if (checkCollisionL(my_spL)) {
			play_single_sound_pongblipf_4();
			dirXChange = true;
		}
		if (checkCollisionR(my_spR)) {
			play_single_sound_pongblipf_5();
			dirXChange = true;
		}
		
		
		if (checkCollisionO(my_balkenO)) {
			play_single_sound_pongblipf4();
			dirYChange = true;
		}
		
		if (checkCollisionU(my_balkenU)) {
			play_single_sound_pongblipf4();
			dirYChange = true;
		}
		moveBall(dirXChange, dirYChange, my_ball.x, my_ball.y);
	}

    function checkCollisionRL() {
		var ball_dirXChange = false;
		var ball_dirYChange = false;
    	// Hilfsvariablen
        var int_r1luy = my_spL.y + my_spL.h;
        var int_r2luy = my_spR.y + my_spR.h;
		
		// pruefung Ball gegen rechten Schlaeger
		
		// rechter roter Schlaeger - x werte zuerst
		// eigentlich my_ball.x + my_ball.r
		if ((my_ball.x + my_ball.r) > my_spR.x)
		{
			// nur drehen , wenn ball auf schlaeger trift 
			if (((my_ball.y - my_ball.r) <= (int_r2luy)) && ((my_ball.y + my_ball.r) >= my_spR.y)) {
				ball_dirXChange = true;
			}
		}
		// linker blauer Schlaeger - x werte zuerst
		// eigentlich bloss einmal - my_ball.r
		if ((my_ball.x - my_ball.r) < (my_spL.x + my_spL.w))
		{
			// nur drehen , wenn ball auf schlaeger trift 
			if (((my_ball.y - my_ball.r) <= (int_r1luy)) && ((my_ball.y + my_ball.r) >= my_spL.y)) {
				ball_dirXChange = true;
			}
		}
		return ball_dirXChange;
    }

    function checkCollisionOU(my_obj) {
		var ball_dirXChange = false;
		var ball_dirYChange = false;
		
		// oberen Balken pruefen
		if (my_ball.v.y < 0) {
			// ball bewegt sich nach oben
   		    // oberen Balken pruefen
			
			// nur untere Linie vom Balken pruefen
			// Ball Postions vor der Bewegung muss unter der linie sein
			// Ball Position nach der Bewegung muss oberhalb der linie sein
			var oldBallY = my_ball.y - my_ball.v.y;
			if ( ((oldBallY - my_ball.r) > my_obj.plu.y) && ((my_ball.y - my_ball.r) <= (my_obj.plu.y)) ) {
				ball_dirYChange = true;
			}

		}
		if (my_ball.v.y > 0) {
			// ball bewegt sich nach unten
		    // Pruefung unterer Balken
			
			// nur obere Linie vom Balken pruefen
			// Ball Postions vor der Bewegung muss oberhalb der linie sein
			// Ball Position nach der Bewegung muss unterhalb der linie sein
			var oldBallY = my_ball.y - my_ball.v.y;
			if ( ((oldBallY + my_ball.r) < my_obj.plo.y) && ((my_ball.y + my_ball.r) >= (my_obj.plo.y)) ) {
				ball_dirYChange = true;
			}

		}
		return ball_dirYChange;
    }

    function checkCollisionO(my_obj) {
		var collision  = false;
		
		// oberen Balken pruefen
		if (my_ball.v.y < 0) {
			// ball bewegt sich nach oben
   		    // oberen Balken pruefen
			
			// nur untere Linie vom Balken pruefen
			// Ball Postions vor der Bewegung muss unter der linie sein
			// Ball Position nach der Bewegung muss oberhalb der linie sein
			var oldBallY = my_ball.y - my_ball.v.y;
			if ( ((oldBallY - my_ball.r) > my_obj.plu.y) && ((my_ball.y - my_ball.r) <= (my_obj.plu.y)) ) {
				collision = true;
			}
			// spezialfall - alte und neue ballposition oberhalb vom balken (untere linie)
			if ( ((oldBallY - my_ball.r) < my_obj.plu.y) && ((my_ball.y - my_ball.r) <= (my_obj.plu.y)) ) {
				collision = true;
			}

		}
		return collision;
    }

    function checkCollisionU(my_obj) {
		var collision  = false;
		
		if (my_ball.v.y > 0) {
			// ball bewegt sich nach unten
		    // Pruefung unterer Balken
			
			// nur obere Linie vom Balken pruefen
			// Ball Postions vor der Bewegung muss oberhalb der linie sein
			// Ball Position nach der Bewegung muss unterhalb der linie sein
			var oldBallY = my_ball.y - my_ball.v.y;
			if ( ((oldBallY + my_ball.r) < my_obj.plo.y) && ((my_ball.y + my_ball.r) >= (my_obj.plo.y)) ) {
				collision = true;
			}
			
			
			// spezialfall - alte und neue ballposition unterhalb vom balken (obere linie)
			if ( ((oldBallY + my_ball.r) > my_obj.plo.y) && ((my_ball.y + my_ball.r) >= (my_obj.plo.y)) ) {
				collision = true;
			}
			

		}
		return collision;
    }
	
    function checkCollisionL(my_obj) {
		var collision = false;
        var int_rux = my_obj.x + my_obj.w;
        var int_luy = my_obj.y + my_obj.h;

		// Linke Torlinie pruefen
		if (my_ball.v.x < 0) {
			// ball bewegt sich nach links
   		    // Linkes Tor pruefen
			
			// nur rechte Linie vom Balken pruefen
			// Ball Position vor der Bewegung muss rechts der linie sein
			// Ball Position nach der Bewegung muss links der linie sein
			var oldBallX = my_ball.x - my_ball.v.x;
			if ( ((oldBallX + my_ball.r) > int_rux) && ((my_ball.x - my_ball.r) <= (int_rux)) ) {
				// nur drehen , wenn ball auf schlaeger trift 
				if (((my_ball.y - my_ball.r) <= (int_luy)) && ((my_ball.y + my_ball.r) >= my_obj.y)) {
					collision = true;
				}
			}

  	    // nicht nutzen, da beweglich
		/*
		this.plo = new Point(x, y);  // Punkt links oben vom Rechteck
		this.plu = new Point(x, y + h);  // Punkt links unten vom Rechteck
		this.pro = new Point(x + w, y);  // Punkt rechts oben vom Rechteck
		this.pru = new Point(x + w, y + h);  // Punkt rechts unten vom Rechteck
		*/

		}

		return collision;
    }

    function checkCollisionR(my_obj) {
		var collision = false;
    	// Hilfsvariablen
        var int_luy = my_obj.y + my_obj.h;

		// Rechts pruefen
		if (my_ball.v.x > 0) {
			// ball bewegt sich nach links
   		    // Linkes Tor pruefen
			
			// nur linke Linie vom Balken pruefen
			// Ball Position vor der Bewegung muss links der linie sein
			// Ball Position nach der Bewegung muss rechts der linie sein
			var oldBallX = my_ball.x - my_ball.v.x;
			if ( ((oldBallX + my_ball.r) < my_obj.x) && ((my_ball.x + my_ball.r) >= (my_obj.x)) ) {
				// nur drehen , wenn ball auf balken trift 
				// oben un unten pruefen
				if (((my_ball.y - my_ball.r) <= (int_luy)) && ((my_ball.y + my_ball.r) >= my_obj.y)) {
					collision = true;
				}
			}

		}

		return collision;
    }

	
    function moveBall(directionChangeX, directionChangeY, act_x_value, act_y_value) {
        var circle = document.getElementById("Ball1");
		if (directionChangeX) {
			 my_ball.v.x = my_ball.v.x * (-1);
		}
		if (directionChangeY) {
			 my_ball.v.y = my_ball.v.y * (-1);
		}
	    var newX = my_ball.v.x  + parseInt(act_x_value);
	    var newY = my_ball.v.y  + parseInt(act_y_value);
        circle.setAttribute("cx", newX);
        circle.setAttribute("cy", newY);
		
		// ball object aktualisieren
		my_ball.x = newX;
		my_ball.y = newY;

		// Position an server senden
	    var cl_name = $('#name').val();
		if (cl_name == 'b') {
			var px = newX.toString();
			var py = newY.toString();
			console.log('spieler b sendet move ball');
			socket.emit('moveball', { posx: px, posy: py});
		}

	}

	// Test device orientation
	// Bsp von Seite: http://www.html5rocks.com/en/tutorials/device/orientation/
	
	if (window.DeviceOrientationEvent) {
	  //document.getElementById("doEvent").innerHTML = "DeviceOrientation";
	  // Listen for the deviceorientation event and handle the raw data
	  window.addEventListener('deviceorientation', function(eventData) {
		// gamma is the left-to-right tilt in degrees, where right is positive
		var tiltLR = eventData.gamma;

		// beta is the front-to-back tilt in degrees, where front is positive
		var tiltFB = eventData.beta;

		// alpha is the compass direction the device is facing in degrees
		var dir = eventData.alpha

		// call our orientation event handler
		deviceOrientationHandler(tiltLR, tiltFB, dir);
	  }, false);
	} 
	else {
	  //document.getElementById("doEvent").innerHTML = "Not supported."
	}

    function deviceOrientationHandler(tiltLR, tiltFB, dir) {
      //document.getElementById("doTiltLR").innerHTML = Math.round(tiltLR);
      //document.getElementById("doTiltFB").innerHTML = Math.round(tiltFB);
      //document.getElementById("doDirection").innerHTML = Math.round(dir);
	  var rounded_tiltLR = Math.round(tiltLR);
	  var sp_name = $('#name').val();
	  var schlaeger_dist = 10;
	  
	  if (rounded_tiltLR < 0) {
		 // schlaeger soll hoch   / handy wurde unten angehoben
		 if (sp_name == 'l') {
			moveBlauHoch(schlaeger_dist);
		 }
		 if (sp_name == 'r') {
			moveRotHoch(schlaeger_dist);
		 }
	  }

	  if (rounded_tiltLR > 0) {
		 // schlaeger soll runter   / handy wurde unten angehoben
		 if (sp_name == 'l') {
			moveBlauRunter(schlaeger_dist);
		 }
		 if (sp_name == 'r') {
			moveRotRunter(schlaeger_dist);
		 }
	  }
  
    }

	var oldY = 0;
	var my_mouse_area;

	function myMouseMoveTest(event) {
		if( window.event)
			event = window.event; //grrr IE
		var mousex = event.clientX - my_mouse_area.offsetLeft;
		//console.log('client mousex:' + mousex);

	}

	function myMouseMove(e) {
		var schlaeger_dist = 15;
		var sp_name = $('#name').val();
		
		// X werte interessieren nicht, nur Mouse hoch oder runter
		var newY = e.clientY;
		//console.log('client mouseOldY:' + oldY);
		//console.log('client mouseNewY:' + newY);
	
		if (oldY == 0) {
			// erstmalig aktuellen Wert merken
			// keine weitere Aktion
			//my_MousePos.x = e.clientX;
			 //my_MousePos.y = newY;
			oldY = newY;
			return;
		}
		
		var x = e.clientX;
		var y = e.clientY;
		var coor = "Coordinates: (" + x + "," + y + ")";
		if (sp_name == 'l') {
			if (oldY > (newY + 1)) {
				moveBlauHoch(schlaeger_dist);
			} 
			if (oldY < (newY - 1)) {
				moveBlauRunter(schlaeger_dist);
			}
		}
		if (sp_name == 'r') {
			if (oldY > (newY + 1)) {
				moveRotHoch(schlaeger_dist);
			} 
			if (oldY < (newY - 1)) {
				moveRotRunter(schlaeger_dist);
			} 
		}
		
		oldY = newY;
		document.getElementById("demo").innerHTML = coor;
	}

	function myMouseOver(event) {
		var x = e.clientX;
		var y = e.clientY;
		var coor = "CoordinatesOver: (" + x + "," + y + ")";
		document.getElementById("demo").innerHTML = coor;
		

	}

	function clearCoor() {
		document.getElementById("demo").innerHTML = "";
	}

	
	function init2() {
		my_mouse_area = document.getElementById("mouse_area")
		my_mouse_area.onmousemove = myMouseMove;
		my_mouse_area.onmouseout = clearCoor;
	}
	init2();

	function play_single_sound_pongblipf4() {
		document.getElementById('audio_pongblipf4').play();
	}
	function play_single_sound_pongblipf_4() {
		document.getElementById('audio_pongblipf_4').play();
	}
	function play_single_sound_pongblipf_5() {
		document.getElementById('audio_pongblipf_5').play();
	}
	function play_single_sound_audio_shot_goal() {
		document.getElementById('audio_shot_goal').play();
	}

});

$(document).on("pagecreate",function(event){
  $(window).on("orientationchange",function(){
    if(window.orientation == 0)
    {
      $("p").text("The orientation has changed to portrait!").css({"background-color":"yellow","font-size":"300%"});
    }
    else
    {
      $("p").text("The orientation has changed to landscape!").css({"background-color":"pink","font-size":"200%"});
    }
  });                   
});