import React, { useState, useCallback, useEffect } from 'react';
import { Copy, Download, Upload, AlertCircle, CheckCircle, Eye, EyeOff, Clipboard, ClipboardPaste, Settings, Type, Space, FileText } from 'lucide-react';
import './App.css';

const ChatGPTTextCleaner = () => {
  const [inputText, setInputText] = useState('');
  const [cleanupResult, setCleanupResult] = useState(null);
  const [showInvisible, setShowInvisible] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // localStorage utility functions with cross-browser compatibility
  const saveToLocalStorage = (key, value) => {
    try {
      if (typeof Storage !== 'undefined' && localStorage) {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.warn('localStorage not available:', error);
    }
  };

  const loadFromLocalStorage = (key, defaultValue) => {
    try {
      if (typeof Storage !== 'undefined' && localStorage) {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      }
    } catch (error) {
      console.warn('Error loading from localStorage:', error);
    }
    return defaultValue;
  };
  
  // Default cleaning options
  const defaultCleaningOptions = {
    // Text case options
    textCase: 'original', // 'original', 'lowercase', 'uppercase', 'sentence'
    
    // Space handling
    removeExtraSpaces: true,
    removeAllSpaces: false,
    
    // Line breaks
    removeLineBreaks: false,
    normalizeLineBreaks: false,
    
    // Additional cleaning
    removeNumbers: false,
    removePunctuation: false,
    removeSpecialChars: false,
    
    // Character removal
    removeNonAscii: false
  };

  // Cleaning options with localStorage
  const [cleaningOptions, setCleaningOptions] = useState(() => 
    loadFromLocalStorage('chatgpt-cleaner-settings', defaultCleaningOptions)
  );

  // Dictionary of problematic characters based on research
  const problematicChars = {
    '\u202F': 'Narrow No-Break Space (NNBSP)',
    '\u200B': 'Zero-Width Space',
    '\u200C': 'Zero-Width Non-Joiner',
    '\u200D': 'Zero-Width Joiner',
    '\uFEFF': 'Zero-Width No-Break Space (BOM)',
    '\u2003': 'Em Space',
    '\u2002': 'En Space',
    '\u2009': 'Thin Space',
    '\u200A': 'Hair Space',
    '\u2060': 'Word Joiner',
    '\u00A0': 'Non-Breaking Space',
    '\u180E': 'Mongolian Vowel Separator',
    '\u2028': 'Line Separator',
    '\u2029': 'Paragraph Separator',
    '\u061C': 'Arabic Letter Mark',
    '\u200E': 'Left-to-Right Mark',
    '\u200F': 'Right-to-Left Mark',
    '\u202A': 'Left-to-Right Embedding',
    '\u202B': 'Right-to-Left Embedding',
    '\u202C': 'Pop Directional Formatting',
    '\u202D': 'Left-to-Right Override',
    '\u202E': 'Right-to-Left Override',
    '\u2066': 'Left-to-Right Isolate',
    '\u2067': 'Right-to-Left Isolate',
    '\u2068': 'First Strong Isolate',
    '\u2069': 'Pop Directional Isolate',
    // Replace special dashes and quotes
    '\u2014': 'Em Dash',
    '\u2013': 'En Dash',
    '\u2018': 'Left Single Quotation Mark',
    '\u2019': 'Right Single Quotation Mark',
    '\u201C': 'Left Double Quotation Mark',
    '\u201D': 'Right Double Quotation Mark',
    '\u2026': 'Horizontal Ellipsis',
    // Additional quotes
    '\u00AB': 'Left-Pointing Double Angle Quotation Mark («)',
    '\u00BB': 'Right-Pointing Double Angle Quotation Mark (»)',
    '\u201E': 'Double Low-9 Quotation Mark („)',
    '\u2032': 'Prime (′)',
    '\u2033': 'Double Prime (″)',
    '\u2035': 'Reversed Prime (‵)',
    '\u2036': 'Reversed Double Prime (‶)'
  };

  const cleanText = useCallback((text, options = cleaningOptions) => {
    let cleanedText = text;
    const removedChars = [];
    let totalRemoved = 0;

    // Count and remove each problematic character
    Object.entries(problematicChars).forEach(([char, name]) => {
      const regex = new RegExp(char, 'g');
      const matches = text.match(regex);
      if (matches) {
        const count = matches.length;
        removedChars.push({
          char,
          name,
          unicode: `U+${char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}`,
          count
        });
        totalRemoved += count;

        // Replace special characters with standard equivalents
        if (char === '\u2014' || char === '\u2013') {
          cleanedText = cleanedText.replace(regex, '-');
        } else if (char === '\u2018' || char === '\u2019') {
          cleanedText = cleanedText.replace(regex, "'");
        } else if (char === '\u201C' || char === '\u201D') {
          cleanedText = cleanedText.replace(regex, '"');
        } else if (char === '\u00AB' || char === '\u00BB' || char === '\u201E') {
          cleanedText = cleanedText.replace(regex, '"');
        } else if (char === '\u2032' || char === '\u2035') {
          cleanedText = cleanedText.replace(regex, "'");
        } else if (char === '\u2033' || char === '\u2036') {
          cleanedText = cleanedText.replace(regex, '"');
        } else if (char === '\u2026') {
          cleanedText = cleanedText.replace(regex, '...');
        } else {
          // For invisible characters, replace with regular space or remove
          if (char === '\u202F' || char === '\u00A0' || char === '\u2003' || char === '\u2002' || char === '\u2009' || char === '\u200A') {
            cleanedText = cleanedText.replace(regex, ' ');
          } else {
            cleanedText = cleanedText.replace(regex, '');
          }
        }
      }
    });

    // Apply additional cleaning options
    
    // Remove numbers
    if (options.removeNumbers) {
      cleanedText = cleanedText.replace(/\d/g, '');
    }
    
    // Remove punctuation
    if (options.removePunctuation) {
      cleanedText = cleanedText.replace(/[^\w\s\u0400-\u04FF]/g, ''); // Keep Cyrillic
    }
    
    // Remove special characters (keep only letters, numbers, spaces)
    if (options.removeSpecialChars) {
      cleanedText = cleanedText.replace(/[^\w\s\u0400-\u04FF]/g, '');
    }
    
    // Remove non-ASCII characters
    if (options.removeNonAscii) {
      cleanedText = cleanedText.replace(/[^\x00-\x7F]/g, '');
    }
    
    // Handle spaces
    if (options.removeAllSpaces) {
      cleanedText = cleanedText.replace(/\s/g, '');
    } else if (options.removeExtraSpaces) {
      cleanedText = cleanedText.replace(/[ \t\f\v]+/g, ' ').trim();
    }
    
    // Handle line breaks
    if (options.removeLineBreaks) {
      cleanedText = cleanedText.replace(/\r?\n/g, ' ');
    } else if (options.normalizeLineBreaks) {
      cleanedText = cleanedText.replace(/\r?\n{2,}/g, '\n\n');
    }
    
    // Apply text case transformation
    switch (options.textCase) {
      case 'lowercase':
        cleanedText = cleanedText.toLowerCase();
        break;
      case 'uppercase':
        cleanedText = cleanedText.toUpperCase();
        break;
      case 'sentence':
        cleanedText = cleanedText.toLowerCase().replace(/(^\w|\.\s+\w)/g, (match) => match.toUpperCase());
        break;
      case 'original':
      default:
        // Keep original case
        break;
    }
    
    // Final cleanup if not removing all spaces
    if (!options.removeAllSpaces && options.removeExtraSpaces) {
      cleanedText = cleanedText.replace(/[ \t\f\v]+/g, ' ').trim();
    }

    return {
      cleanedText,
      removedChars: removedChars.filter(item => item.count > 0),
      totalRemoved
    };
  }, [cleaningOptions]);

  // Track last processed text to avoid recursion
  const [lastProcessedText, setLastProcessedText] = useState('');

  // Save settings to localStorage when they change
  useEffect(() => {
    saveToLocalStorage('chatgpt-cleaner-settings', cleaningOptions);
  }, [cleaningOptions]);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileKeywords = ['mobile', 'android', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];
      return mobileKeywords.some(keyword => userAgent.includes(keyword)) || window.innerWidth <= 768;
    };
    
    setIsMobile(checkMobile());
    
    // Listen for resize events
    const handleResize = () => setIsMobile(checkMobile());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Manual paste from clipboard (for mobile)
  const handlePasteFromClipboard = useCallback(async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text.trim()) {
          setInputText(text);
        }
      }
    } catch (err) {
      console.log('Clipboard access denied:', err);
      // Fallback: focus on textarea for manual paste
      const textarea = document.querySelector('textarea');
      if (textarea) {
        textarea.focus();
        textarea.select();
      }
    }
  }, []);

  // Auto-read clipboard function (desktop only)
  const readClipboard = useCallback(async () => {
    // Skip auto-reading on mobile devices
    if (isMobile) return;
    
    try {
      // Check if clipboard API is supported
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        // Only update if text is different from current input AND not the same as last processed
        if (text.trim() && text !== inputText && text !== lastProcessedText) {
          setInputText(text);
        }
      }
    } catch (err) {
      console.log('Clipboard access denied or not available:', err);
    }
  }, [inputText, lastProcessedText, isMobile]);

  // Auto-read clipboard on page load and focus
  useEffect(() => {
    // Read clipboard on initial load
    readClipboard();

    // Read clipboard when window gets focus (user returns to tab)
    const handleWindowFocus = () => {
      readClipboard();
    };

    // Add event listeners
    window.addEventListener('focus', handleWindowFocus);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [readClipboard]);

  // Auto-convert on input change
  useEffect(() => {
    if (inputText.trim()) {
      const result = cleanText(inputText);
      setCleanupResult(result);
      
      // Only auto-copy if text actually changed (was cleaned)
      if (result.totalRemoved > 0) {
        setLastProcessedText(result.cleanedText);
        handleCopy(result.cleanedText);
      }
    } else {
      setCleanupResult(null);
    }
  }, [inputText, cleanText]);

  const handleCopy = async (textToCopy) => {
    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleDownload = () => {
    if (!cleanupResult?.cleanedText) return;

    const blob = new Blob([cleanupResult.cleanedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cleaned_text.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      setInputText(text);
    };
    reader.readAsText(file);
  };

  const visualizeInvisibleChars = (text) => {
    if (!showInvisible) return text;

    let visualized = text;
    Object.entries(problematicChars).forEach(([char, name]) => {
      const replacement = `<span class="bg-red-200 text-red-800 px-1 rounded text-xs" title="${name}">[${name.split(' ')[0]}]</span>`;
      visualized = visualized.replace(new RegExp(char, 'g'), replacement);
    });

    return visualized;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              ChatGPT Text Cleaner
            </h1>
            <p className="text-gray-600 text-lg">
              Удаляет скрытые Unicode символы и водяные знаки из текста, сгенерированного ChatGPT
            </p>
            <p className="text-gray-600 text-lg">
              Сообщения об ошибках: <a href={'https://x.com/byghoster'}>My X Profile - https://x.com/byghoster</a>
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left column - Input */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">Original Text</h2>
                <div className="flex items-center space-x-3">
                  {isMobile && (
                    <button
                      onClick={handlePasteFromClipboard}
                      className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
                      title="Paste from clipboard"
                    >
                      <ClipboardPaste className="h-4 w-4" />
                      <span className="hidden sm:inline">Paste</span>
                    </button>
                  )}
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="file"
                      accept=".txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Upload className="h-5 w-5 text-gray-500" />
                    <span className="text-sm text-gray-600 hidden sm:inline">Upload</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste ChatGPT text here..."
                  className="w-full h-40 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setShowInvisible(!showInvisible)}
                    className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
                  >
                    {showInvisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span>{showInvisible ? 'Hide' : 'Show'} invisible characters</span>
                  </button>

                  <span className="text-sm text-gray-500">
                    {inputText.length} characters
                  </span>
                </div>

                {showInvisible && inputText && (
                  <div
                    className="p-4 bg-gray-50 rounded-lg text-sm border max-h-32 overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: visualizeInvisibleChars(inputText) }}
                  />
                )}
              </div>
            </div>

            {/* Right column - Result */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">Cleaned Text</h2>

              {cleanupResult ? (
                <div className="space-y-4">
                  <textarea
                    value={cleanupResult.cleanedText}
                    readOnly
                    className="w-full h-40 p-4 border rounded-lg bg-gray-50 resize-none"
                  />

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {cleanupResult.cleanedText.length} characters
                    </span>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleCopy(cleanupResult.cleanedText)}
                      className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      {copySuccess ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      <span className="hidden sm:inline">{copySuccess ? 'Copied!' : 'Copy'}</span>
                    </button>

                    <button
                      onClick={handleDownload}
                      className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      <span className="hidden sm:inline">Download</span>
                    </button>
                  </div>

                  {/* Statistics of removed characters */}
                  {cleanupResult.totalRemoved > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h3 className="font-medium text-green-800 mb-3">
                        Characters removed: {cleanupResult.totalRemoved}
                      </h3>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {cleanupResult.removedChars.map((item, index) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <span className="text-green-700">
                              {item.name} ({item.unicode})
                            </span>
                            <span className="bg-green-200 text-green-800 px-2 py-1 rounded-full text-xs">
                              {item.count}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {cleanupResult.totalRemoved === 0 && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                      <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <p className="text-gray-600">No problematic characters found!</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-40 bg-gray-50 rounded-lg flex items-center justify-center text-gray-500">
                  <p>Cleaned text will appear here</p>
                </div>
              )}
            </div>
          </div>

          {/* Cleaning Options Panel */}
          <div className="mb-8 bg-gray-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Настройки очистки
              </h3>
              <div className="flex items-center space-x-4">
                <span className="text-xs text-gray-500">
                  Настройки сохраняются автоматически
                </span>
                <button
                  onClick={() => setCleaningOptions(defaultCleaningOptions)}
                  className="text-sm text-blue-600 hover:text-blue-700 underline"
                  title="Сбросить к настройкам по умолчанию"
                >
                  Сбросить
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Text Case Options */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700 flex items-center">
                  <Type className="h-4 w-4 mr-2" />
                  Регистр текста
                </h4>
                <div className="space-y-2">
                  {[
                    { value: 'original', label: 'Исходный' },
                    { value: 'lowercase', label: 'Нижний регистр' },
                    { value: 'uppercase', label: 'ВЕРХНИЙ РЕГИСТР' },
                    { value: 'sentence', label: 'Первая заглавная' }
                  ].map((option) => (
                    <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="textCase"
                        value={option.value}
                        checked={cleaningOptions.textCase === option.value}
                        onChange={(e) => setCleaningOptions(prev => ({ ...prev, textCase: e.target.value }))}
                        className="text-blue-600"
                      />
                      <span className="text-sm text-gray-600">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Space Handling */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700 flex items-center">
                  <Space className="h-4 w-4 mr-2" />
                  Пробелы
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cleaningOptions.removeExtraSpaces}
                      onChange={(e) => setCleaningOptions(prev => ({ 
                        ...prev, 
                        removeExtraSpaces: e.target.checked,
                        removeAllSpaces: e.target.checked ? prev.removeAllSpaces : false
                      }))}
                      className="text-blue-600"
                    />
                    <span className="text-sm text-gray-600">Удалить лишние пробелы</span>
                  </label>
                  
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cleaningOptions.removeAllSpaces}
                      onChange={(e) => setCleaningOptions(prev => ({ 
                        ...prev, 
                        removeAllSpaces: e.target.checked,
                        removeExtraSpaces: e.target.checked ? false : prev.removeExtraSpaces
                      }))}
                      className="text-blue-600"
                    />
                    <span className="text-sm text-gray-600">Удалить все пробелы</span>
                  </label>
                </div>
              </div>

              {/* Line Breaks */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Переносы строк
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cleaningOptions.removeLineBreaks}
                      onChange={(e) => setCleaningOptions(prev => ({ 
                        ...prev, 
                        removeLineBreaks: e.target.checked,
                        normalizeLineBreaks: e.target.checked ? false : prev.normalizeLineBreaks
                      }))}
                      className="text-blue-600"
                    />
                    <span className="text-sm text-gray-600">Удалить переносы строк</span>
                  </label>
                  
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cleaningOptions.normalizeLineBreaks}
                      onChange={(e) => setCleaningOptions(prev => ({ 
                        ...prev, 
                        normalizeLineBreaks: e.target.checked,
                        removeLineBreaks: e.target.checked ? false : prev.removeLineBreaks
                      }))}
                      className="text-blue-600"
                    />
                    <span className="text-sm text-gray-600">Нормализовать переносы</span>
                  </label>
                </div>
              </div>

              {/* Additional Cleaning */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700">Дополнительная очистка</h4>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cleaningOptions.removeNumbers}
                      onChange={(e) => setCleaningOptions(prev => ({ ...prev, removeNumbers: e.target.checked }))}
                      className="text-blue-600"
                    />
                    <span className="text-sm text-gray-600">Удалить цифры</span>
                  </label>
                  
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cleaningOptions.removePunctuation}
                      onChange={(e) => setCleaningOptions(prev => ({ ...prev, removePunctuation: e.target.checked }))}
                      className="text-blue-600"
                    />
                    <span className="text-sm text-gray-600">Удалить знаки препинания</span>
                  </label>
                  
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cleaningOptions.removeSpecialChars}
                      onChange={(e) => setCleaningOptions(prev => ({ ...prev, removeSpecialChars: e.target.checked }))}
                      className="text-blue-600"
                    />
                    <span className="text-sm text-gray-600">Удалить спецсимволы</span>
                  </label>
                  
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cleaningOptions.removeNonAscii}
                      onChange={(e) => setCleaningOptions(prev => ({ ...prev, removeNonAscii: e.target.checked }))}
                      className="text-blue-600"
                    />
                    <span className="text-sm text-gray-600">Только ASCII символы</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile instructions */}
          {isMobile && (
            <div className="mt-8 bg-orange-50 border-l-4 border-orange-400 p-4">
              <div className="flex items-start">
                <Clipboard className="h-5 w-5 text-orange-400 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-orange-700">
                  <p className="font-medium mb-2">Mobile Usage:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Use the "Paste" button to paste from clipboard</li>
                    <li>Text will auto-clean and auto-copy back to clipboard</li>
                    <li>Or manually paste text using Ctrl+V / Cmd+V</li>
                    <li>Long-press the cleaned text area to copy result</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Information panel - moved below input/output fields */}
          <div className="mt-8 bg-blue-50 border-l-4 border-blue-400 p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-2">What this tool removes:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Invisible spaces (Narrow No-Break Space, Zero-Width Space)</li>
                  <li>Special dashes (Em Dash, En Dash) → replaces with regular dash</li>
                  <li>Smart quotes → replaces with standard quotes</li>
                  <li>Angle quotes (« ») → replaces with standard quotes</li>
                  <li>Special quotation marks („ ′ ″) → replaces with standard quotes</li>
                  <li>Directional characters (Left-to-Right Mark, Right-to-Left Mark)</li>
                  <li>Other hidden Unicode marker characters</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Additional information */}
          <div className="mt-6 bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">About Hidden Characters in ChatGPT</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
              <div>
                <h4 className="font-medium mb-2">What are they?</h4>
                <p>
                  New ChatGPT models (o3, o4-mini) add invisible Unicode characters to generated text.
                  These characters serve as hidden watermarks to identify AI-generated content.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Why remove them?</h4>
                <p>
                  Hidden characters can cause issues when copying text, break formatting,
                  and lead to unexpected behavior in text editors and web forms.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatGPTTextCleaner;

