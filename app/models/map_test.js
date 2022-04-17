const CarsMap =require("./hash map");
let map=new CarsMap();
let car1={
    id:121,
    lat:30.137257757806026,
    long: 31.733712884170462
}
let car2={
    id:122,
    lat:30.143032495070457, 
    long:31.721843678892316
}
let car3={
    id:123,
    lat:30.158581892382134,
    long:31.69909157920493
}

map.set(car1)
map.set(car2)//الجامعة الروسية
map.set(car3)//الاسكان

console.log(map.search({lat:30.15368995523567, long:31.70007324351394}))//ابني بيتك
console.log(map.search({lat:30.144098900318276,long:31.72335907939857}))// النادي
console.log(map.search({lat:30.12716446886198,long:31.716944838722384}))//صانية الجهاز القديم 
console.log(map.search({lat:22.227284064101593,long:36.49458436423228}))// اخر الدنيا"في مصر"هه  

map.delete(121)
map.delete(122)
map.delete(123)

console.log(map.search({lat:30.144098900318276,long:31.72335907939857}))// النادي

// map.set(1,new Map())
// map.get(1).set(1,1);
// map.set(2,new Map())
// console.log(map.get(1));
//159.143.137