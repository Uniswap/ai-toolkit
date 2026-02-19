# Claude Code Sandbox Dockerfile
# Based on Anthropic's official devcontainer: https://github.com/anthropics/claude-code/tree/main/.devcontainer
#
# This Dockerfile creates a secure, sandboxed environment for running Claude Code
# with the --dangerously-skip-permissions flag. The container includes:
# - Network restrictions via iptables/ipset (whitelist-only external access)
# - Non-root user for improved security
# - Claude Code CLI pre-installed
# - Development tools (git, zsh, fzf, etc.)

# Base image with Node.js 22 (matching ai-toolkit requirements)
FROM mcr.microsoft.com/devcontainers/typescript-node:22

# Build arguments
ARG TZ=America/Los_Angeles
ARG CLAUDE_CODE_VERSION=latest
ARG GIT_DELTA_VERSION=0.18.2
ARG ZSH_IN_DOCKER_VERSION=1.2.0

# Environment variables
ENV TZ=${TZ} \
    LANG=en_US.UTF-8 \
    LANGUAGE=en_US:en \
    LC_ALL=en_US.UTF-8 \
    EDITOR=nano \
    VISUAL=nano \
    NPM_CONFIG_PREFIX=/usr/local/share/npm-global \
    PATH=/usr/local/share/npm-global/bin:$PATH

# Install system dependencies
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
        less \
        git \
        procps \
        sudo \
        fzf \
        zsh \
        man-db \
        unzip \
        gnupg2 \
        gh \
        iptables \
        ipset \
        iproute2 \
        dnsutils \
        aggregate \
        jq \
        nano \
        vim \
        curl \
        wget \
        ca-certificates \
        locales \
    && locale-gen en_US.UTF-8 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install git-delta for improved diffs
RUN ARCH=$(dpkg --print-architecture) \
    && curl -fsSL "https://github.com/dandavison/delta/releases/download/${GIT_DELTA_VERSION}/git-delta_${GIT_DELTA_VERSION}_${ARCH}.deb" -o /tmp/git-delta.deb \
    && dpkg -i /tmp/git-delta.deb \
    && rm /tmp/git-delta.deb

# Install zsh with Oh My Zsh and Powerlevel10k
RUN sh -c "$(curl -fsSL https://raw.githubusercontent.com/deluan/zsh-in-docker/refs/tags/v${ZSH_IN_DOCKER_VERSION}/zsh-in-docker.sh)" -- \
    -t https://github.com/romkatv/powerlevel10k \
    -p fzf \
    -p git \
    -p https://github.com/zsh-users/zsh-autosuggestions \
    -p https://github.com/zsh-users/zsh-syntax-highlighting

# Create directories for persistent storage
RUN mkdir -p /commandhistory \
    && mkdir -p /home/node/.claude \
    && touch /commandhistory/.bash_history \
    && chown -R node:node /commandhistory \
    && chown -R node:node /home/node/.claude

# Configure bash history persistence
RUN SNIPPET="export PROMPT_COMMAND='history -a' && export HISTFILE=/commandhistory/.bash_history" \
    && echo "$SNIPPET" >> "/home/node/.bashrc"

# Install Claude Code CLI globally
RUN npm install -g @anthropic-ai/claude-code@${CLAUDE_CODE_VERSION}

# Copy firewall initialization script
COPY init-firewall.sh /usr/local/bin/init-firewall.sh
RUN chmod +x /usr/local/bin/init-firewall.sh

# Configure sudo for firewall script (passwordless for specific command)
RUN echo "node ALL=(ALL) NOPASSWD: /usr/local/bin/init-firewall.sh" >> /etc/sudoers.d/node-firewall \
    && chmod 0440 /etc/sudoers.d/node-firewall

# Set default shell to zsh for the node user
RUN chsh -s /usr/bin/zsh node

# Switch to non-root user
USER node

# Set working directory
WORKDIR /workspace

# Default command
CMD ["zsh"]
