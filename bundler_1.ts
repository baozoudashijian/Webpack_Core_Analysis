import { parse } from '@babel/parser'
import traverse from '@babel/traverse'
import { readFileSync } from "fs";
import { resolve, relative, dirname } from "path";
import * as babel from '@babel/core'

const projectRoot = resolve(__dirname, 'project_1')

type DepRelation = {
    [key: string]: {
        deps: string[],
        code?: string | null | undefined
    }
}

const depRelation: DepRelation = {}

collect(resolve(projectRoot, 'index.js'))

console.log(depRelation)

function collect(filepath: string) {
    const key = getProjectPath(filepath)

    if (Object.keys(depRelation).includes(key)) {
        return
    }

    const code = readFileSync(filepath).toString()

    const { code: es5Code } = babel.transform(code, {
        presets: ['@babel/preset-env']
    }) as {code: string}



    depRelation[key] = { deps: [], code: es5Code }

    const ast = parse(code, { sourceType: 'module' })

    traverse(ast, {
        enter: path => {
            if (path.node.type === 'ImportDeclaration') {
                const depAbsolutePath = resolve(dirname(filepath), path.node.source.value)

                const depProjectPath = getProjectPath(depAbsolutePath)

                depRelation[key].deps.push(depProjectPath)

                collect(depAbsolutePath)
            }
        }
    })
}

function getProjectPath(path: string) {
    return relative(projectRoot, path)
}
