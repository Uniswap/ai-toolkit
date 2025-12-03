# Claude Code Sandbox - Development Container
# Provides a secure, isolated environment for running Claude Code with --dangerously-skip-permissions
#
# Based on: https://github.com/anthropics/claude-code/tree/main/.devcontainer
# Reference: https://www.ksred.com/claude-code-dangerously-skip-permissions-when-to-use-it-and-when-you-absolutely-shouldnt/

FROM node:22

# Build arguments for customization
ARG TIMEZONE=America/Los_Angeles
ARG CLAUDE_CODE_VERSION=latest
ARG GIT_DELTA_VERSION=0.18.2
ARG ZSH_IN_DOCKER_VERSION=1.2.0

# Set environment variables
ENV DEVCONTAINER=true
ENV TZ=${TIMEZONE}
ENV EDITOR=nano
ENV npm_config_prefix=/usr/local/share/npm-global
ENV PATH=$PATH:/usr/local/share/npm-global/bin

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    less \
    git \
    procps \
    sudo \
    fzf \
    zsh \
    man-db \
    unzip \
    gnupg2 \
    iptables \
    ipset \
    iproute2 \
    dnsutils \
    aggregate \
    jq \
    nano \
    vim \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install GitHub CLI
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
    && chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
    && apt-get update \
    && apt-get install -y gh \
    && rm -rf /var/lib/apt/lists/*

# Install git-delta for enhanced diffs
RUN curl -L https://github.com/dandavison/delta/releases/download/${GIT_DELTA_VERSION}/git-delta_${GIT_DELTA_VERSION}_amd64.deb -o /tmp/git-delta.deb \
    && dpkg -i /tmp/git-delta.deb \
    && rm /tmp/git-delta.deb

# Configure git with delta
RUN git config --global core.pager delta \
    && git config --global interactive.diffFilter "delta --color-only" \
    && git config --global delta.navigate true \
    && git config --global delta.light false \
    && git config --global delta.side-by-side true \
    && git config --global merge.conflictStyle diff3 \
    && git config --global diff.colorMoved default

# Install Claude Code CLI globally
RUN npm install -g @anthropic-ai/claude-code@${CLAUDE_CODE_VERSION}

# Setup node user with sudo access
RUN echo "node ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/node \
    && chmod 0440 /etc/sudoers.d/node

# Create directories
RUN mkdir -p /commandhistory /workspace /home/node/.claude /usr/local/share/npm-global \
    && chown -R node:node /commandhistory /workspace /home/node/.claude /usr/local/share/npm-global

# Install zsh with oh-my-zsh and powerlevel10k theme
RUN sh -c "$(curl -fsSL https://raw.githubusercontent.com/deluan/zsh-in-docker/v${ZSH_IN_DOCKER_VERSION}/zsh-in-docker.sh)" -- \
    -t powerlevel10k/powerlevel10k \
    -p git \
    -p fzf \
    -p command-not-found

# Configure bash history persistence
RUN SNIPPET="export PROMPT_COMMAND='history -a' && export HISTFILE=/commandhistory/.bash_history" \
    && mkdir -p /commandhistory \
    && touch /commandhistory/.bash_history \
    && chown -R node:node /commandhistory \
    && echo "$SNIPPET" >> "/home/node/.bashrc"

# Copy firewall initialization script
COPY init-firewall.sh /usr/local/bin/init-firewall.sh
RUN chmod +x /usr/local/bin/init-firewall.sh \
    && echo "node ALL=(ALL) NOPASSWD: /usr/local/bin/init-firewall.sh" >> /etc/sudoers.d/node

# Switch to non-root user
USER node

# Set working directory
WORKDIR /workspace

# Set default shell to zsh
SHELL ["/bin/zsh", "-c"]

# Default command
CMD ["zsh"]
