/*const {add, sub} = require('./calculator')

console.log(add(6, 3))
console.log(sub(10, 3))*/
//const a = require('./calculator')
//console.log(a)

/*const sum =require('./calculator');
console.log(sum(30,100));*/

/*const SudentDtails = require('./calculator')
const s = new SudentDtails('Ninagreddy', 25)
console.log(s.name)
console.log(s.age)
console.log(s)*/

/*const {value,studentName}=require('./calculator');
console.log(value);
console.log(studentName);*/

/*const {sum,sub}=require('./calculator');
console.log(sum(100,200));
console.log(sub(500,300));*/

const {studentDeatils, carDeatils} = require('./calculator')
const s = new studentDeatils('Ninga', 25)
console.log(s.name)
console.log(s.age)
console.log(s)

const car = new carDeatils('BMW', '18000')
console.log(car.name)
console.log(car.speed)
