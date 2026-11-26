# Questions asked about sonix

One per line, in the order asked. `[agent]` = asked by the coding agent while building the ticket; `[me]` = asked by me.

- [agent] Where do the "Set up sonix" and "Add a new part" issues live, given they aren't in this repo? (answer: the course repo `cs4602-27100039`, issues #6 and #7)
- [agent] Why does `npm run docker -- up` fail on Windows with `spawnSync /bin/bash ENOENT`? (answer: `BIN_BASH_PATH` is hard-coded to `/bin/bash`)
- [agent] Why does the Postgres 18 container keep restarting on a fresh volume? (answer: 18+ wants the volume at `/var/lib/postgresql`, not `.../data`)
- [agent] Why does the Logto import say "No such container: postgres"? (answer: the scripts `docker exec postgres`, but the container is `postgres_aiws`)
- [agent] What does `toMoney()` expect: dollars or cents? (answer: dollars; it multiplies by 100, so the spec's `toMoney(dto.cost)` on a cents value would store 100x)
- [agent] What are the RavenDB ids for vendors, bins and locations, and does `locationId` arrive bare (`LOC_AAA`) or prefixed (`locations/LOC_AAA`)? (answer: `vendors/{code}`, `bins/{LOC}/{code}`, `locations/{LOC}`; the list API accepts both forms)
- [agent] Is `pogNumber` auto-uppercased (spec line 535) or rejected when not uppercase (spec line 875)? (the spec contradicts itself; we followed 535)
- [agent] Does `session.load(ids[])` return an array or a map? (answer: a map of id -> document or null)
- [agent] What does the ValidationPipe do with unknown fields? (answer: `whitelist` + `forbidNonWhitelisted`, so an unknown field is a 400)
- [agent] How does a thrown `BadRequestException` become the problem-details `errors[]` the frontend shows? (answer: an array message whose entries start with the field name)
- [agent] Which token do part API calls use: the user token or the location token? (answer: the location token from `RESOLVED_LOCATION_CONTEXT`)
- [agent] Do `/vendors`, `/bins` and `/uoms` exist in the API that the frontend queries already call? (answer: no; there is no vendor or bin module yet)
- [agent] Why are the locked property tests slow: is it `create` or the generators? (answer: 1000 creates take 144 ms; the property harness takes ~20 s per property)
- [agent] Why does `biome check .` report 305 format errors on files nobody touched? (answer: `core.autocrlf=true` checks them out with CRLF)
