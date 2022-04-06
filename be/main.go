package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/mysql"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type Intake struct {
	Country string      `json:"country"`
	City    string      `json:"city"`
	Results []CDNMetric `json:"results"`
}

type CDNMetric struct {
	CDN   string
	Time  float64
	Cache bool
}

type Result struct {
	gorm.Model
	CDN     string
	Time    float64
	Cache   bool
	Country string
	City    string
	IP      string
}

func main() {
	dsn := os.Getenv("CYF_DSN")
	if dsn == "" {
		fmt.Println("Missing SQL DB DSN")
		return
	}
	var db *gorm.DB
	var err error

	err = nil

	dbType := os.Getenv("CYF_DB_TYPE")
	if dbType == "mysql" {
		db, err = gorm.Open(mysql.Open(dsn), &gorm.Config{})
	} else if dbType == "postgres" {
		db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	} else {
		fmt.Print("Missing or unsupported DB type")
		return
	}

	if err != nil {
		panic("failed to connect database")
	}

	db.AutoMigrate(&Result{})

	r := gin.Default()
	r.ForwardedByClientIP = true
	r.SetTrustedProxies([]string{"0.0.0.0/0"})

	r.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})

	r.GET("/ip", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"ip": c.ClientIP(),
		})
	})

	r.POST("/intake", func(c *gin.Context) {
		jsonData, err := ioutil.ReadAll(c.Request.Body)
		if err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}

		res := new(Intake)
		err = json.Unmarshal(jsonData, &res)
		if err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}
		var metrics []Result
		for _, v := range res.Results {
			metrics = append(metrics, Result{
				Country: res.Country,
				City:    res.City,
				IP:      c.ClientIP(),
				CDN:     v.CDN,
				Time:    v.Time,
				Cache:   v.Cache,
			})
		}
		db.Create(&metrics)
		c.JSON(200, gin.H{"message": "success"})
	})
	r.Run()
}
