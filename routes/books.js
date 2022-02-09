const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs =require("fs");
const Book = require("../models/book");
const Author = require("../models/author");
const uploadPath = path.join("public",Book.coverImageBasePath);
const imageMimeTypes = ['image/jpeg','image/png','images/gif']
const upload = multer({
    dest : uploadPath,
    fileFilter : (req,file,callback)=>{
        callback(null,imageMimeTypes.includes(file.mimetype))
    } //.includes(file.mimetype)
});

//All Books Route
router.get("/", async (req,res)=>{
    let query = Book.find();
    if(req.query.title !== null && req.query.title !== ""){
        query = query.regex("title",new RegExp(req.query.title,'i'))
    };
    if(req.query.publishedBefore !== null && req.query.publishedBefore !== ""){
        query = query.lte("publishDate",req.query.publishedBefore)
    };
    if(req.query.publishedAfter !== null && req.query.publishedAfter !== ""){
        query = query.gte("publishDate",req.query.publishedAfter)
    };
    try{
        const books = await query.exec();
        res.render("books/index",{
            books : books,
            searchOptions : req.query,
        });
    } catch {
        res.redirect("/");
    };
});

//New Book Route
router.get('/new',async (req,res)=>{
    renderNewPage(res,new Book());
});

//Create Book Route
router.post('/',upload.single('cover'),async (req,res)=>{
    const fileName = req.file != null ? req.file.filename : null;
    const auth = req.body.author;
    let tmp='';
    for(let i = 0 ; i< 24 ; i++){
        tmp += auth[i];
    }
    
    // if (!req.body.author.match(/^[0-9a-fA-F]{24}$/)) {
    //     console.error("格式错误",tmp,tmp[23]);
    //     return;
    // }
    console.log('/'+tmp+'/')
    const book = new Book({
        author : tmp,//req.body.author,
        title : req.body.title,
        publishDate : new Date(req.body.publishDate),
        pageCount : req.body.pageCount,
        coverImageName : fileName,
        description : req.body.description,      
    });
    try{
        const newBook = await book.save();
        // res.redirect(`/books/${newBook.id}`);
        res.redirect("books")
    } catch(error) {
        if(book.coverImageName != null){
            removeBookCover(book.coverImageName);         
        };
        console.error(error);
        // console.log(Date(),book);
        console.log(Date(),req.body.author,"///");               
        renderNewPage(res,book,true);
    }
});

function removeBookCover(fileName){
    fs.unlink(path.join(uploadPath,fileName),err => {
        if(err) console.error(err);
    })
};

async function renderNewPage(res,book,hasError = false){
    try{
        const authors = await Author.find({});
        const params = {
            authors : authors,
            book : book
        }
        if(hasError) {
            // console.log(Date(),params.book);
            params.errorMessage = 'Now Error Creating Book';
        }        
        res.render("books/new",params)
    } catch {        
        res.redirect("/books")
    }; 
}

module.exports = router;