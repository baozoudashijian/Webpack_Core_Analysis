import { parse } from '@babel/parser'
import traverse from '@babel/traverse'
import { readFileSync, writeFileSync } from "fs";
import { resolve, relative, dirname } from "path";
import * as babel from '@babel/core'

const projectRoot = resolve(__dirname, 'project_1')

type DepRelation = {
    key: string,
    deps: string[],
    code: string

}[]

const depRelation: DepRelation = []

collect(resolve(projectRoot, 'index.js'))

writeFileSync('dist_2.js', generateCode())
console.log('done')

function generateCode() {
  let code = ''
  code += 'var depRelation = [' + depRelation.map(item => {
    const { key, deps, code } = item
    return `{
      key: ${JSON.stringify(key)}, 
      deps: ${JSON.stringify(deps)},
      code: function(require, module, exports){
        ${code}
      }
    }`
  }).join(',') + '];\n'
  code += 'var modules = {};\n'
  code += `execute(depRelation[0].key)\n`
  code += `
  function execute(key) {
    if (modules[key]) { return modules[key] }
    var item = depRelation.find(i => i.key === key)
    if (!item) { throw new Error(\`\${item} is not found\`) }
    var pathToKey = (path) => {
      var dirname = key.substring(0, key.lastIndexOf('/') + 1)
      var projectPath = (dirname + path).replace(\/\\.\\\/\/g, '').replace(\/\\\/\\\/\/, '/')
      return projectPath
    }
    var require = (path) => {
      return execute(pathToKey(path))
    }
    modules[key] = { __esModule: true }
    var module = { exports: modules[key] }
    item.code(require, module, module.exports)
    return modules[key]
  }
  `
  return code
}

console.log(depRelation)

function collect(filepath: string) {
    const key = getProjectPath(filepath)

    if (depRelation.find(i => i.key === key)) {
        return
    }

    const code = readFileSync(filepath).toString()

    const { code: es5Code } = babel.transform(code, {
        presets: ['@babel/preset-env']
    }) as { code: string }


    const item: {
        key: string,
        deps: string[],
        code: string
    
    } = { key, deps: [], code: es5Code }
    depRelation.push(item)

    const ast = parse(code, { sourceType: 'module' })

    traverse(ast, {
        enter: path => {
            if (path.node.type === 'ImportDeclaration') {
                const depAbsolutePath: string = resolve(dirname(filepath), path.node.source.value)

                const depProjectPath = getProjectPath(depAbsolutePath)

                item.deps.push(depProjectPath as string)

                collect(depAbsolutePath)
            }
        }
    })
}

function getProjectPath(path: string) {
    return relative(projectRoot, path)
}
