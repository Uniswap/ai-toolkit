#!/usr/bin/env bash

# sign into 1password and fetch the read-only npm token
eval $(op signin)
NPM_TOKEN=$(op read "op://Engineering/read-only npm-token - npmrc/token")

NPM_AUTH_LINE="export NODE_AUTH_TOKEN=$NPM_TOKEN"

# add to the bash shell so this env var is always exported
echo "$NPM_AUTH_LINE" >> ~/.bashrc

# if the user uses zsh, update .zshrc as well
if [ -f ~/.zshrc ]; then
    echo "$NPM_AUTH_LINE" >> ~/.zshrc
fi

# finally, update the ~/.npmrc file to use the correct
# NODE_AUTH_TOKEN when authenticating with npmjs
cat <<EOF >> ~/.npmrc
@uniswap:registry=https://registry.npmjs.org
registry=https://registry.npmjs.org/
always-auth=true
//registry.npmjs.org/:_authToken=\${NODE_AUTH_TOKEN}
EOF
