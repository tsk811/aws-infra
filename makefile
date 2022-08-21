#npm
install.cdk:
	npm install -g aws-cdk

install: install.cdk
	npm install
	cdk synth