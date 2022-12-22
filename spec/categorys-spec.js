const db = require('../app/data_control/db.js').Database;
let database = db.getInstance();

describe("Caregorys",()=>{

    let id;
    
    it("the method should get all categorys",async ()=>{
        let is_categorys_0=await database.categories().has("0")

        expect(is_categorys_0).toEqual(true);
    })
    
    it("the method should add a category",async ()=>{
        id= await database.addCategory("new category")
        category=database.categories().get(id);

        expect(category.name).toBe("new category")
    })

    it("the method should update a category's name",async ()=>{
        await database.updateCategoryInfo({id:id,name:"another name"})
        category=database.categories().get(id);

        expect(category.name).toBe("another name")
    })

    it("the method should delete a category",async ()=>{
        await database.removeCategory({id:id})
        is_category=database.categories().has(id);

        expect(is_category).toBe(false)
    })
    
})
