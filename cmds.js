const  Sequelize = require('sequelize');
const {log, biglog, errorlog, colorize} = require("./out");
const {models} = require('./model');

/*23:31*/
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
	models.quiz.findAll()
	.each(quiz => {
			log(` [${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
	})
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};

const validateId = id => {

	return new Sequelize.Promise((resolve, reject) => {
		if (typeof id === "undefined") {
			reject(new Error(`Falta el parámetro <id>.`));
		} else {
			id = parseInt(id);
			if (Number.isNaN(id)) {
				reject(new Error(`El valor del parámetro <id> no es un número.`));
			} else {
				resolve(id);
			}
		}
	});
};

exports.showCmd = (rl, id) =>{
	validateId(id)
	.then(id => models.quiz.findById(id))
	.then(quiz => {
		if(!quiz) {
			throw new Error(`No existe un error asociado al id=${id}.`);
		}
		log(` [${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
	})
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};

const makeQuestion = (rl, text) => {
	return new Sequelize.Promise((resolve, reject) => {
		rl.question(colorize(text, 'red'), answer => {
			resolve(answer.trim());
		});
	});
};

exports.addCmd = rl =>{
	makeQuestion(rl, 'Introduzca una pregunta: ')
	.then(q => {
		return makeQuestion(rl, 'Introduzca la respuesta: ')
		.then(a => {
			return {question: q, answer: a};
		});
	})
	.then(quiz => {
		return models.quiz.create(quiz);
	})
	.then((quiz) => {
		log(` ${colorize('Se ha añadido', 'magenta')}: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
	})
	.catch(Sequelize.ValidationError, error => {
		errorlog('El quiz es erróneo:');
		error.errors.forEach(({message}) => errorlog(message));
	})
	.catch(error => {
		errorlog(error.message);
	})
	.then(() =>  {
		rl.prompt();
	});
};

exports.deleteCmd = (rl, id) =>{
	validateId(id)
	.then(id => models.quiz.destroy({where: {id}}))
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};

exports.editCmd = (rl, id) =>{
	validateId(id)
	.then(id => models.quiz.findById(id))
	.then(quiz => {
		if (!quiz) {
			throw new Error(`No existe un quiz asociado al id=${id}.`);
		}
		process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)}, 0);
		return makeQuestion(rl, 'Introduzca la pregunta: ')
		.then(q => {
			process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)}, 0);
			return makeQuestion(rl, 'Introduzca la respuesta: ')
			.then(a => {
				quiz.question = q;
				quiz.answer = a;
				return quiz;
			});
		});
	})
	.then(quiz => {
		return quiz.save();
	})
	.then(quiz => {
		log(` Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
	})
	.catch(Sequelize.ValidationError, error => {
		errorlog('El quiz es erróneo:');
		error.errors.forEach(({message}) => errorlog(message));
	})
	.catch(error => {
		errorlog(error.message);
	})
	.then(() =>  {
		rl.prompt();
	});
};

exports.testCmd = (rl, id) =>{
	validateId(id)
	.then(id => models.quiz.findById(id))
	.then(quiz => {
		if (!quiz) {
			throw new Error(`No existe un quiz asociado al id=${id}.`);
		}
		
		makeQuestion(rl, quiz.question+"? ")
		.then(a => {
			if(quiz.answer.toLowerCase().trim() === a.toLowerCase().trim()){
				log("Su respuesta es correcta.", 'green');
				biglog('CORRECTO', 'green');
			} else{
					log("Su respuesta es incorrecta.", 'red');
					biglog('INCORRECTO', 'red');
			}
		})
		.then(() => {
			rl.prompt();
		});
		
	})
	.catch(Sequelize.ValidationError, error => {
		errorlog('El quiz es erróneo:');
		error.errors.forEach(({message}) => errorlog(message));
	})
	.catch(error => {
		errorlog(error.message);
	})
	.then(() =>  {
		rl.prompt();
	});
};

exports.playCmd = rl =>{
	let score = 0;
	let qUnresolved = [];
	
	const playOne = () => {
		return Promise.resolve()
		.then(() => {		
		if(qUnresolved.length === 0){
			log("Fin del juego! Aciertos: " + score);
			biglog(score, 'magenta');
			rl.prompt();
			return;
		} 
		
		let id = Math.floor(Math.random() * qUnresolved.length);
		let quiz = qUnresolved[id];
		qUnresolved.splice(id, 1);

		makeQuestion(rl, quiz.question)
		.then(answer => {

			if(answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim()) {
					score++;
					log('CORRECTO - LLeva '+ score + ' aciertos.', 'green');
					playOne();
				} else{
					log('INCORRECTO.', 'red');
					log("Fin del juego! Aciertos: " + score);
					biglog(score, 'magenta');		
				}

			})
		.then(() => {
			rl.prompt();
		});
		});
	};
	/*raw para que solo te devuelva el array con los valores, y no datos extra, si no lo pones no pasa nada */
	models.quiz.findAll({raw: true}) 
	.then(quizzes => {
		qUnresolved = quizzes;
	})
	/*Cuando acabe esta promesa llama al playone, no antes porque no estaria el array relleno*/
	.then(() => {
		return playOne();
	})
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};

exports.creditsCmd = rl =>{
	log("Autores de la práctica:", 'red');
 	log("MARINA GONZALEZ GONZALEZ", 'green');
 	log("MARIA ORTEGA PEREZ", 'green');
 	rl.prompt();
};

exports.quitCmd = rl =>{
	rl.close();
	rl.prompt();
};