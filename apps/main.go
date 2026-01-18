package main

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/template/html/v2"
)

func main() {
	// Create a new engine
	engine := html.New("./views", ".html")

	// Pass the engine to the Views
	app := fiber.New(fiber.Config{
		Views: engine,
	})

	//routes
	app.Static("public", "./public")
	app.Get("/", func(c *fiber.Ctx) error {
		return c.Render("main/index", fiber.Map{})
	})

	app.Listen(":3000")
}
