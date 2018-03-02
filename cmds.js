const {log, biglog, errorlog, colorize} = require("./out");
const model = require('./model');


/*Comando de ayuda*/
exports.helpCmd = rl =>{
	log("Comandos:", 'green');
 	log(" h|help -  Muestra la lista de ayuda.", 'green');
 	log(" list - Listar los quizzes existentes.", 'green');
 	log(" show <id> - Muestra la pregunta y la respuesta del quiz indicado.", 'green');
 	log(" add - Añadir un nuevo quiz interactivamente.", 'green');
 	log(" delete <id> - Borrar el quiz indicado", 'green');
 	log(" edit <id> - Editar el quiz indicado.", 'green');
 	log(" test <id> - Probar el quiz indicado.", 'green');
 	log(" p|play - Jugar a preguntar aleatoriamente todos los quizzes.", 'green');
 	log(" credits - Créditos.", 'green');
 	log(" q|quit - Salir del programa.", 'green');
 	rl.prompt();
};

exports.listCmd = rl =>{
	model.getAll().forEach((quiz, id) => {log(`[${colorize(id, 'magenta')}]: ${quiz.question}`);
	});
	rl.prompt();
};

exports.showCmd = (rl, id) =>{
	if (typeof id === "undefined") {
		errorlog(`Falta el parámetro id.`);
	} else {
		try{
			const quiz = model.getByIndex(id);
			log(` [${colorize(id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
		} catch(error) {
			errorlog(error.message);
		}
	}
	rl.prompt();
};

exports.addCmd = rl =>{
	rl.question(colorize(' Introduzca una pregunta: ', 'red'), question => {
		rl.question(colorize(' Introduzca la respuesta: ', 'red'), answer => {
			model.add(question, answer);
			log(` ${colorize('Se ha añadido', 'magenta')}: ${question} ${colorize('=>', 'magenta')} ${answer}`);
			rl.prompt();
		});
	});
};

exports.deleteCmd = (rl, id) =>{
	if (typeof id === "undefined") {
		errorlog(`Falta el parámetro id.`);
	} else {
		try{
			model.deleteByIndex(id);
		} catch(error) {
			errorlog(error.message);
		}
	}
	rl.prompt();
};

exports.editCmd = (rl, id) =>{
	if (typeof id === "undefined") {
		errorlog(`Falta el parámetro id.`);
		rl.prompt();
	} else {
		try{
			const quiz = model.getByIndex(id);

			process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)},0);

			rl.question(colorize(' Introduzca una pregunta: ', 'red'), question => {

				process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)},0);

				rl.question(colorize(' Introduzca la respuesta: ', 'red'), answer => {
					model.update(id, question, answer);
					log(` Se ha cambiado el quiz ${colorize(id, 'magenta')}  por: ${question} ${colorize('=>', 'magenta')} ${answer}`);
					rl.prompt();
				});
			});
		} catch(error) {
			errorlog(error.message);
			rl.prompt();
		}
	}
};

exports.testCmd = (rl, id) =>{
	if (typeof id === "undefined") {
	errorlog(`Falta el parámetro id.`);
		rl.prompt();
	} else {
		try{
			const quiz = model.getByIndex(id);
			rl.question(colorize(quiz.question+"? ", 'red'), answer => {
				if (quiz.answer.toLowerCase().trim() === answer.toLowerCase().trim()){
					log("Su respuesta es correcta.", 'green');
					biglog('CORRECTO', 'green');
					rl.prompt();
				} else{
					log("Su respuesta es incorrecta.", 'red');
					biglog('INCORRECTO', 'red');
					rl.prompt();
				}
			});
		} catch(error) {
			errorlog(error.message);
			rl.prompt();
		}
	}	
};

exports.playCmd = rl =>{
	let score = 0;
	let qUnresolved = [];
	for(let i=0; i < model.count(); i++){
		qUnresolved[i] = model.getByIndex(i);
	};
	const playOne = () => {
		if(qUnresolved.length === 0){
			log("Fin del juego! Aciertos: " + score);
			biglog(score, 'magenta');
			score = 0;
			rl.prompt();
		} else {
			let idAleat = Math.random() * (qUnresolved.length - 1);
			let id = Math.round(idAleat);
			rl.question(colorize(qUnresolved[id].question+"? ", 'red'), answer => {
				if (qUnresolved[id].answer.toLowerCase().trim() === answer.toLowerCase().trim()){
					score++;
					log('CORRECTO - LLeva '+ score + ' aciertos.', 'green');
					qUnresolved.splice(id, 1);
					playOne();
				} else{
					log('INCORRECTO.', 'red');
					log("Fin del juego! Aciertos: " + score);
					biglog(score, 'magenta');
					score = 0;
					rl.prompt();
				}
			});

		}
	};
	playOne();
};

exports.creditsCmd = rl =>{
	log("Autores de la práctica:", 'red');
 	log("Marina González González", 'green');
 	log("María Ortega Pérez", 'green');
 	rl.prompt();
};

exports.quitCmd = rl =>{
	rl.close();
	rl.prompt();
};