export async function assertRepo(t, repository, fixture) {
  if (fixture === undefined) {
    t.is(repository, undefined);
  } else {
    t.is(repository.fullName, fixture.fullName);

    if (fixture.owner) {
      t.is(repository.owner.name, fixture.owner.name);
      t.is(repository.owner.id, fixture.owner.id);
    }

    if (fixture.hooks) {
      for await (const h of repository.hooks()) {
        const fh = fixture.hooks.find(x => x.id === h.id);
        if (fh) {
          t.is(h.id, fh.id);
          t.is(h.url, fh.url);
          t.is(h.active, fh.active);
          t.deepEqual(h.events, fh.events);
        }
      }
    }

    if (fixture.provider) {
      t.is(repository.provider.constructor, fixture.provider);
    }
  }
}

export async function createBranchFrom(source, pattern, options)
{
  let name = pattern;

  let n = 1;

  for await (const b of source.repository.branches(pattern)) {
    console.log("FOUND", b.name);
    n++;
  }

  name = pattern.replace(/\*/,n);
  
  console.log('NEW BRANCH', pattern, name);
  return source.createBranch(name, options);
}