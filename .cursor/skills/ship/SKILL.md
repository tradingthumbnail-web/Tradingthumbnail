---
name: ship
description: Ship the actual changes to the repository. This skill is used to commit, ship, prepare a PR (if necessary), tag and release code to a repository. Invoke whenever the user asks you to "ship".
argument-hint: "🚀"
license: free of use
---

# Ship

## Core idea
The idea of this skill is to always release code in the same way.

**Commits**: The commits will always follow the same structure.
- Lowercase: always write in lowercase
- Initial line: Indicate at the beggining what type of change has been done and where e.g. refactor(workspace), fix(payment), feature(processing pipeline), followed by a description.
- Detiled bullet points: after the initial line, we will jump a line and add detailed bullet points of what was exactly the change, in chronological order.

Example of a good commit:
```
feature(tiktok processor): added tiktok API to the data processing pipeline and tagging of research projects

- added an endpoint to the server to process tiktok API videos
- added a new query parameter `research_project` to the server
- the new query parameter passes through the server and is inserted into the document at mongodb, with the same key
- fix the dry run bug at query parameter level so it prints all the processed lines
```

**PRs**: If the changes are a non-main branch, prepare a PR and check for merging viability. If the changes are non-mergeble, ask the user if they want you to fix them or they prefer to inspect them manually.
If everything looks good, merge the code.
For PR body, follow a similar but more detailed schema from the **commit** one.

**Tag and releases**: We will always tag and release the versions of the software. Follow the convention we have in the `/product/docs/` folder. If the version is not inferrable from the docs or from the conversation, ask the user.

We will always follow a MAJOR.MINOR.SMALL_CHANGE convention, and we will only promote to v1.0 when explicitly stipulated or if we are already on that version. If not, we will move from v0.9 to v0.10, from v0.99 to v0.100, and so on.

## Considerations
If we didn't go through `/release-refactor-review` skill before commiting, inform the user and stop the process.

## Remotes
We usualy have two remotes:
- `origin`: github remote
- `minerva`: gitea remote
We should promote to both remotes. If the structure changes or is unclear, ask the user.