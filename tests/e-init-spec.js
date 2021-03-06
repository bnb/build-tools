//const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

//const rimraf = require('rimraf');
//const pathKey = require('path-key')();

const createSandbox = require('./sandbox');

describe('e-init', () => {
  let sandbox;
  beforeEach(() => {
    sandbox = createSandbox();
  });
  afterEach(() => {
    sandbox.cleanup();
  });

  describe('--root', () => {
    it('creates a new directory with a .gclient file', () => {
      const root = path.resolve(sandbox.tmpdir, 'master');
      const gclient_file = path.resolve(root, '.gclient');

      // confirm these files don't exist when the test starts
      expect(!fs.existsSync(root)).toStrictEqual(true);
      expect(!fs.existsSync(gclient_file)).toStrictEqual(true);

      // run `e init` with a user-specified root
      const result = sandbox
        .eInitRunner()
        .root(root)
        .name('name')
        .run();

      // confirm tht it worked
      expect(result.exitCode).toStrictEqual(0);
      expect(fs.statSync(root).isDirectory()).toStrictEqual(true);
      expect(fs.statSync(gclient_file).isFile()).toStrictEqual(true);
    });

    it('logs an info message when the new build config root already has a .gclient file', () => {
      const root = path.resolve(sandbox.tmpdir, 'master');

      // run `e init` twice on the same directory with two names
      let result;
      result = sandbox
        .eInitRunner()
        .root(root)
        .name('name1')
        .run();
      result = sandbox
        .eInitRunner()
        .root(root)
        .name('name2')
        .run();

      // confirm that it works but gave an info message about it
      expect(result.exitCode).toStrictEqual(0);
      expect(result.stdout).toEqual(expect.stringContaining('INFO'));
      expect(result.stdout).toEqual(expect.stringContaining('already exists'));
    });

    it('refuses to use a pre-existing directory that lacks its own .gclient file', () => {
      // make a nonempty directory
      const existingDir = path.resolve(sandbox.tmpdir, 'hello');
      fs.mkdirSync(existingDir);
      fs.writeFileSync(path.resolve(existingDir, 'world.txt'), 'hello-exists-and-is-not-empty');

      // run `e init` with a nonempty root directory
      const result = sandbox
        .eInitRunner()
        .root(existingDir)
        .name('name')
        .run();

      // confirm that it failed
      expect(result.exitCode).not.toStrictEqual(0);
      expect(result.stderr).toEqual(expect.stringContaining('ERR'));
    });
  });

  it('fails if a build configuration name is not specified', () => {
    // run `e init` without a build config name
    const result = sandbox.eInitRunner().run();

    // confirm that it errored out and gave a Help message
    expect(result.exitCode).not.toStrictEqual(0);
    expect(result.stdout).toEqual(expect.stringContaining('Usage'));
  });

  it('does not overwrite existing configs unless --force', () => {
    // confirm that `e init` with the same name twice doesn't work...
    const root = path.resolve(sandbox.tmpdir, 'master');
    let result;
    result = sandbox
      .eInitRunner()
      .root(`${root}1`)
      .name('name')
      .run();
    result = sandbox
      .eInitRunner()
      .root(`${root}2`)
      .name('name')
      .run();
    expect(result.exitCode).not.toStrictEqual(0);
    expect(result.stderr).toEqual(expect.stringContaining('ERR'));

    // ...unless you add '--force'
    result = sandbox
      .eInitRunner()
      .root(`${root}2`)
      .name('name')
      .force()
      .run();
    expect(result.exitCode).toStrictEqual(0);
  });

  it('Uses $PWD/electron as the default root', () => {
    // chdir to the test's tmpdir
    const cwd = process.cwd();
    process.chdir(sandbox.tmpdir);

    // run `e init` without specifying a root
    sandbox
      .eInitRunner()
      .name('name')
      .run();

    // confirm that $cwd/electron is the default root
    const expectedRoot = path.resolve(sandbox.tmpdir, 'electron');
    const result = sandbox
      .eShowRunner()
      .root()
      .run();
    expect(result.exitCode).toStrictEqual(0);
    expect(result.stdout).toStrictEqual(expectedRoot);

    // restore the real cwd
    process.chdir(cwd);
  });

  it('Defaults to an outdir that fits the import name', () => {
    const root = path.resolve(sandbox.tmpdir, 'master');
    sandbox
      .eInitRunner()
      .root(root)
      .import('debug')
      .name('name')
      .run();
    const result = sandbox
      .eShowRunner()
      .out()
      .run();
    expect(result.exitCode).toStrictEqual(0);
    expect(result.stdout).toStrictEqual('Debug');
  });

  /*
  it('Adds SCCACHE environmental variables', () => {
  });
  /*
   */
});
