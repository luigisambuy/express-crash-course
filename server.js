const express = require("express")
const app = express()

app.use(express.static("public"))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.set("view engine", "ejs")

const finchRouter = require("./routes/finch")

app.use("/finch", finchRouter)

app.listen(3000)
