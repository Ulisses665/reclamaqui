# Escopo do projeto

## Situação

Desenvolver uma aplicação para registrar e acompanhar reclamações relacionadas ao ambiente escolar como um todo.

## Contexto e restrições

- A aplicação será desenvolvida em TypeScript.
- O projeto será somente frontend: não terá backend, banco de dados, autenticação ou API própria.
- Os dados serão persistidos no navegador.

## Funcionalidades previstas

- Criar e visualizar postagens.
- Visualizar perfil e concluir sua criação.
- Editar perfil.
- Excluir postagens.
- Filtrar postagens.
- Salvar os dados localmente no navegador.

## Processo e cuidados

O desenvolvimento será feito em etapas, com componentes, estados e persistência local. O projeto deverá ser testado e receber os ajustes necessários para reduzir denúncias falsas e publicações feitas de brincadeira ou com má intenção.

## Expectativas

- As postagens devem permanecer disponíveis até que a escola resolva a situação relatada.
- Cada pessoa deve conseguir acessar seu perfil usando uma senha.
- Os alunos só poderão registrar reclamações usando um perfil criado e verificado pela escola.
- Cada aluno poderá visualizar somente as próprias reclamações.
- Usuários com perfil de ADMIN poderão visualizar todas as reclamações de todos os alunos.
- Devem ser enviadas notificações à escola e aos estudantes.

## Observação sobre viabilidade

O documento prevê perfis criados e verificados pela escola, acesso ao perfil por senha e envio de notificações, mas também determina que o projeto não tenha backend, banco de dados, autenticação ou API própria. Esses requisitos precisam ser conciliados durante o planejamento: uma aplicação apenas frontend, com dados no navegador, não oferece por si só verificação centralizada de perfis, controle confiável de acesso nem envio confiável de notificações à escola e aos estudantes.
