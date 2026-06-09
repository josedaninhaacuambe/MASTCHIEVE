#NoTrayIcon
#SingleInstance "Ignore"
#Requires AutoHotkey "2.0"

SetTitleMatchMode(2)
SendMode("Input")
SetWorkingDir(A_ScriptDir)

; Auto-elevate: se não estiver rodando como Administrador, relança com UAC
if not A_IsAdmin
{
    try
        Run(Format('*RunAs "{}"', A_ScriptFullPath))
    ExitApp()
}

; Criar mutex via janela oculta somente na instância elevada
UniqueTitle := "AllowClaudeAutoYes_" A_ComputerName "_" A_UserName
DetectHiddenWindows(true)

if WinExist(UniqueTitle)
{
    ExitApp()
}

MyGui := Gui()
MyGui.Show("Hide", UniqueTitle)

; Variáveis globais
global Enabled := true
global DialogHwnd := 0
global DialogStartTime := 0

; Atalho para alternar o script: Ctrl+Alt+P
^!p::
{
    global Enabled
    Enabled := !Enabled
    status := Enabled ? "ATIVADO ✓" : "DESATIVADO ✗"
    TrayTip("Claude Auto-Yes", "Auto-Yes " . status, 2)
}

; Atalho para sair do script: Ctrl+Alt+Q
^!q::
{
    TrayTip("Claude Auto-Yes", "Encerrando...", 2)
    Sleep(300)
    ExitApp()
}

; Mostrar ajuda: Ctrl+Shift+Esc
^+Esc::
{
    MsgBox("Claude Auto-Yes Script v2`n`nAtalhos:`nCtrl+Alt+P = Alternar ON/OFF`nCtrl+Alt+Q = Sair`nCtrl+Shift+Esc = Mostrar esta ajuda")
}

; Timer principal: monitora janelas do VS Code
SetTimer(AcceptClaudeDialog, 250)

AcceptClaudeDialog()
{
    global Enabled, DialogHwnd, DialogStartTime

    if not Enabled
        return

    ; Procura por janelas do VS Code (processo Code.exe)
    idList := WinGetList("ahk_exe Code.exe")
    found := false
    foundColor := 0
    CoordMode("Pixel", "Screen")

    for this_id in idList
    {
        try
        {
            WinGetPos(&X, &Y, &W, &H, "ahk_id " . this_id)
        }
        catch
            continue

        ; Ignora janelas muito pequenas
        if (W < 200 || H < 200)
            continue

        ; Procura em área COMPLETA da janela
        SearchAreas := [
            {x1: X, y1: Y, x2: X + W, y2: Y + H}  ; Toda a janela
        ]

        ; Cores de botões a procurar (com tolerância MÁXIMA)
        ; Qualquer tom de azul, verde, branco, cinza que seja botão
        ButtonColors := [0x3B82F6, 0x2563EB, 0x0078D4, 0x10B981, 0x06B6D4, 0x6B7280, 0x4F46E5, 0x7C3AED, 0xE5E7EB, 0xF3F4F6, 0xD1D5DB, 0xFFFFFF, 0x000000]

        for area in SearchAreas
        {
            for color in ButtonColors
            {
                ; Tolerância MUITO alta
                if PixelSearch(&px, &py, area.x1, area.y1, area.x2, area.y2, color, 120)
                {
                    found := true
                    prompt_id := this_id
                    foundColor := color
                    break 2
                }
            }
        }

        if found
            break
    }

    if not found
    {
        DialogHwnd := 0
        DialogStartTime := 0
        return
    }

    ; Regista o dialogo e começa a contar o tempo
    if (DialogHwnd != prompt_id)
    {
        DialogHwnd := prompt_id
        DialogStartTime := A_TickCount
    }

    ; Calcula tempo decorrido em segundos
    elapsed := (A_TickCount - DialogStartTime) / 1000

    ; Se passaram 10 segundos sem interação, pressiona Enter e clica no botão
    if (elapsed >= 10)
    {
        try
        {
            ; Ativa a janela
            WinActivate("ahk_id " . prompt_id)
            WinWaitActive("ahk_id " . prompt_id, , 1)
            Sleep(150)

            ; Clica no botão encontrado
            if (px && py)
            {
                MouseGetPos(&origX, &origY)
                CoordMode("Mouse", "Screen")
                MouseClick("Left", px, py)
                Sleep(200)
                MouseMove(origX, origY)
            }
            else
            {
                ; Fallback: envia Enter se não conseguir encontrar botão
                ControlSend("{Enter}", , "ahk_id " . prompt_id)
                Sleep(120)
            }
        }
        catch Error as err
        {
            ; Log silencioso de erros
        }

        DialogHwnd := 0
        DialogStartTime := 0
    }
}
