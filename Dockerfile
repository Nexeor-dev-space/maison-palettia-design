# syntax=docker/dockerfile:1
# ==========================================================================
# Dockerfile — RUNTIME ONLY. It never runs `next build`.
# ==========================================================================
#
# `next build` prerenders every page through Payload's Local API, so it needs
# the migrated production database and the host's `.env` (SPEC §A.5). A
# build inside `docker build` would need both inside the build context —
# credentials in a layer, and the shared database reachable from the
# builder. So the host builds (scripts/deploy.sh: preflight → npm ci →
# migrate → next build) and this file only packages the result:
#
#   .next/standalone   the traced server (server.js + the node_modules it uses)
#   .next/static       hashed JS/CSS chunks (standalone leaves them out)
#   public/            images, fonts, video
#
# .dockerignore is a whitelist of exactly those three, minus what the
# tracer drags in that must never be baked into an image (.env, a snapshot
# of media/ and private/, the photographic masters).
#
# THE HOST AND THE IMAGE MUST MATCH. node_modules inside the standalone
# folder carry native binaries (sharp/libvips) for the platform that ran
# `npm ci`. Build on linux/amd64 with glibc and run this Debian (glibc)
# image on the same architecture; never an Alpine (musl) base.
#
# State lives outside the image, as volumes (docker-compose.yml): media/
# (uploads) and private/ (invoice PDFs) at /app — the folder
# cms/lib/paths.ts resolves as the project root when the standalone server
# sits there — plus the `.env` the compose file passes in.
#
# Usage: scripts/deploy.sh --restart compose   (builds and tags the image),
# or by hand after a host build:  docker compose build app && docker compose up -d app
# ==========================================================================
FROM node:22-bookworm-slim

ENV NODE_ENV=production \
    PORT=3200 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

# `node` (uid 1000) ships with the base image. Owning /app lets the server
# write its ISR cache under .next/; media/ and private/ are volumes.
COPY --chown=node:node .next/standalone ./
COPY --chown=node:node .next/static ./.next/static
COPY --chown=node:node public ./public
RUN mkdir -p media private && chown node:node media private

USER node
EXPOSE 3200

# A real route, not the port: a process whose Payload failed to boot still
# listens and answers 500 (docs/cms/DECISIONS.md #7).
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3200)+'/api/users/me').then(r=>process.exit(r.status===200?0:1),()=>process.exit(1))"

CMD ["node", "server.js"]
