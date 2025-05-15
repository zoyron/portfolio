---
title: "Personal TypeScript Notes"
summary: "Compilation of notes that I write/have written while making projects using typescript"
date: "May 15 2025"
draft: false
tags:
  - Programming
---

> These are just rough notes, and not meant for learning. Here I just ramble on about the things I realize while using typescript.

While passing props to a react functional component, you can either create interface or types for the props or you can define their type annotations inline. Let's see what the difference is.

**Creating interface**
Suppose I want to pass `username`, and `otp` as props to a react functional component, following is a way to create `interface` for them, and pass it to them:

```ts
interface VerifyProps {
  username: string;
  otp: string;
}

export default function Verify({ username, otp }: VerifyProps) {
  // ... rest of the cod here
}
```

The other way is to define the type annotations inline. Let's how that goes:

**Defining type annotations inline**
This time, instead of creating interface, let's pass the types inline

```ts
export default function Verify({
  username,
  otp,
}: {
  username: string;
  otp: string;
}) {
  // ... rest of the code
}
```

I earlier thought the correct way to do that is `... Verify({usernane: string, otp: string})`. But this is wrong. With this method, typescript interprets your code such that you're giving an alias to username and otp, and both the aliases are `string`.
This would have confused typescript in 2 ways:

- confusion one would be that both the variables - username, and otp, have the same alias.
- confusion two would be with the word `string` since it is also a reserved keyword.
