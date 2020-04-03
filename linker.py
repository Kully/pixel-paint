'''statically link javascript files into one''' 

input_file_array = ['js/modules/randomImport.js', 'js/modules/anotherScript.js']
linkedFile = 'js/linked_modules.js'
scriptFile = 'js/script.js'
outputFile = 'js/master.js'


def combine_text_files_into_string(input_file_array):
    linkedText = '// *******\n// IMPORTS \n// *******\n\n'
    for filename in input_file_array:
        with open(filename, 'r') as f:
            linkedText += f'// {filename}\n'
            linkedText += f.read()
            linkedText += '\n\n'
    return linkedText

def overwrite_text_to_file(text, file):
    with open(file, 'w') as f:
        f.write(text)

def merge_file1_and_file2_then_write_to_file3(file1, file2, file3):
    with open(file1, 'r') as f:
        file1_text = f.read()

    with open(file2, 'r') as f:
        file2_text = f.read()

    with open(file3, 'w') as f:
        f.write(file1_text+file2_text)


linkedText = combine_text_files_into_string(input_file_array)
overwrite_text_to_file(linkedText, linkedFile)
merge_file1_and_file2_then_write_to_file3(linkedFile, scriptFile, outputFile)
