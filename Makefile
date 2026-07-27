APP_NAME := Coo.app
BUNDLE := apps/desktop/src-tauri/target/release/bundle/macos/$(APP_NAME)
DEST := /Applications/$(APP_NAME)

.PHONY: build install uninstall reinstall

build:
	-pnpm --filter desktop tauri build
	@test -d "$(BUNDLE)" || (echo "error: $(BUNDLE) not found (build failed)" && exit 1)

install: build
	rm -rf "$(DEST)"
	cp -R "$(BUNDLE)" "$(DEST)"
	open "$(DEST)"

uninstall:
	pkill -f "$(DEST)" || true
	rm -rf "$(DEST)"

reinstall: uninstall install
