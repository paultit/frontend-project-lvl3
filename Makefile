install:
	npm install

publish:
	npm publish --dry-run

develop:
	npx webpack-dev-server

build:
	rm -rf dist
	NODE_ENV=production npx webpack	
lint:
	npx eslint .
