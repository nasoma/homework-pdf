WAILS    := $(shell go env GOPATH)/bin/wails
APP_NAME := Homework PDF

.PHONY: dev build build-intel clean

## make dev — hot-reload development server
dev:
	$(WAILS) dev

## make build — production .app bundle for Apple Silicon
build:
	$(WAILS) build -platform darwin/arm64 -clean
	@mv "build/bin/homeworkpdf.app" "build/bin/$(APP_NAME).app" 2>/dev/null || true
	@echo "Built: build/bin/$(APP_NAME).app"

## make build-intel — production .app bundle for Intel Mac
build-intel:
	$(WAILS) build -platform darwin/amd64 -clean
	@mv "build/bin/homeworkpdf.app" "build/bin/$(APP_NAME).app" 2>/dev/null || true
	@echo "Built: build/bin/$(APP_NAME).app"

clean:
	rm -rf build/bin frontend/dist
