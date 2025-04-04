'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import AnalysisCategory from '@/components/AnalysisCategory';
import { NameMatchAnalysis } from '@/types/name-analysis';
import { getFromLocalStorage, saveToLocalStorage } from '@/lib/utils';
import { FavoriteNameItem } from '@/types/favorite-name-item';

export default function AnalyzePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [chineseTranslation, setChineseTranslation] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [meaningTheme, setMeaningTheme] = useState('');
  const [chineseMetaphysics, setChineseMetaphysics] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<NameMatchAnalysis | null>(null);
  const [error, setError] = useState('');

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Please enter a name to analyze');
      return;
    }

    setIsAnalyzing(true);
    setError('');
    setAnalysis(null);

    try {
      const response = await fetch('/api/name-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          gender,
          meaningTheme,
          chineseMetaphysics,
          chineseTranslation: chineseTranslation.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Analysis failed: ${response.statusText}`);
      }

      setAnalysis(data.analysis);
    } catch (err) {
      console.error('Error during name analysis:', err);
      setError((err as Error).message || 'Failed to analyze name. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddToFavorites = async () => {
    if (!analysis) return;

    try {
      // Get existing favorites from localStorage
      const existingFavorites = getFromLocalStorage<string[]>('favoriteNames', []);
      const existingFavoriteItems = getFromLocalStorage<FavoriteNameItem[]>('favoriteNameDetails', []);

      // Create a unique ID for this favorite
      const favoriteId = `${analysis.name}-${Date.now()}`;

      // Create the favorite item object
      const favoriteItem: FavoriteNameItem = {
        id: favoriteId,
        name: analysis.name,
        gender,
        meaningTheme,
        chineseMetaphysics,
        timestamp: Date.now()
      };

      // Add to favorites if not already there
      if (!existingFavorites.includes(analysis.name)) {
        existingFavorites.push(analysis.name);
        saveToLocalStorage('favoriteNames', existingFavorites);
      }

      // Always add the item with specific criteria to favoriteItems
      existingFavoriteItems.push(favoriteItem);
      saveToLocalStorage('favoriteNameDetails', existingFavoriteItems);

      alert(`${analysis.name} has been added to your favorites!`);
    } catch (err) {
      console.error('Error adding to favorites:', err);
      alert('Failed to add to favorites. Please try again.');
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Direct Name Analysis</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Analyze a Specific Name</CardTitle>
          <CardDescription>
            Enter a name and criteria to get a detailed analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAnalyze} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name to Analyze</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="chineseTranslation">Chinese Translation (Optional)</Label>
                <Input
                  id="chineseTranslation"
                  value={chineseTranslation}
                  onChange={(e) => setChineseTranslation(e.target.value)}
                  placeholder="Enter Chinese translation if known"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Gender</Label>
              <RadioGroup
                value={gender}
                onValueChange={(value) => setGender(value as 'Male' | 'Female')}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Male" id="male" />
                  <Label htmlFor="male">Male</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Female" id="female" />
                  <Label htmlFor="female">Female</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="meaningTheme">Meaning or Theme</Label>
              <Textarea
                id="meaningTheme"
                value={meaningTheme}
                onChange={(e) => setMeaningTheme(e.target.value)}
                placeholder="E.g., Love, Peace, Strength, Success"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="chineseMetaphysics">Chinese Metaphysics Criteria</Label>
              <Textarea
                id="chineseMetaphysics"
                value={chineseMetaphysics}
                onChange={(e) => setChineseMetaphysics(e.target.value)}
                placeholder="E.g., BaZi (Four Pillars), Qi Men Dun Jia, Feng Shui"
                rows={2}
              />
            </div>

            {error && <p className="text-red-500">{error}</p>}

            <div className="flex justify-between">
              <Button
                type="submit"
                disabled={isAnalyzing || !name.trim()}
                className="px-6"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : 'Analyze Name'}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/search')}
              >
                Back to Search
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {analysis && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Analysis for {analysis.name}</span>
              <span className={`text-sm px-3 py-1 rounded-full ${analysis.overallMatch ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                {analysis.overallMatch ? 'Good Match' : 'Partial Match'}
              </span>
            </CardTitle>
            <CardDescription>
              {analysis.summary}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Name Origin and Meaning */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-md">
                <h3 className="text-md font-semibold">Origin</h3>
                <p>{analysis.origin || 'No origin information available'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-md">
                <h3 className="text-md font-semibold">Meaning</h3>
                <p>{analysis.meaning || 'No meaning information available'}</p>
              </div>
            </div>

            {/* Chinese Translations */}
            {analysis.chineseTranslations && analysis.chineseTranslations.length > 0 && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Chinese Translations</h3>
                <div className="space-y-3">
                  {analysis.chineseTranslations.map((translation, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-md">
                      <p className="text-lg font-medium mb-1">{translation.translation}</p>
                      <p className="text-gray-600">{translation.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed Analysis */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Detailed Analysis</h3>

              <AnalysisCategory
                title="Character Analysis"
                matches={analysis.characterAnalysis.matches}
                explanation={analysis.characterAnalysis.explanation}
                score={analysis.characterAnalysis.score}
              />

              <AnalysisCategory
                title="Name Structure Analysis"
                matches={analysis.nameAnalysis.matches}
                explanation={analysis.nameAnalysis.explanation}
                score={analysis.nameAnalysis.score}
              />

              {/* Cultural & Psychological Analysis */}
              {analysis.culturalPsychologicalAnalysis && (
                <div className="space-y-2">
                  <AnalysisCategory
                    title="Cultural & Psychological Analysis"
                    matches={analysis.culturalPsychologicalAnalysis.matches}
                    explanation={analysis.culturalPsychologicalAnalysis.explanation}
                    score={analysis.culturalPsychologicalAnalysis.score}
                  />

                  {analysis.culturalPsychologicalAnalysis.historicalReferences &&
                    analysis.culturalPsychologicalAnalysis.historicalReferences.length > 0 && (
                    <div className="pl-4 border-l-2 border-gray-200">
                      <h4 className="text-sm font-medium">Historical References:</h4>
                      <ul className="list-disc pl-5 text-sm">
                        {analysis.culturalPsychologicalAnalysis.historicalReferences.map((ref, i) => (
                          <li key={i}>{ref}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysis.culturalPsychologicalAnalysis.psychologicalImpact && (
                    <div className="pl-4 border-l-2 border-gray-200">
                      <h4 className="text-sm font-medium">Psychological Impact:</h4>
                      <p className="text-sm">{analysis.culturalPsychologicalAnalysis.psychologicalImpact}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Literary & Artistic Analysis */}
              {analysis.literaryArtisticAnalysis && (
                <div className="space-y-2">
                  <AnalysisCategory
                    title="Literary & Artistic Analysis"
                    matches={analysis.literaryArtisticAnalysis.matches}
                    explanation={analysis.literaryArtisticAnalysis.explanation}
                    score={analysis.literaryArtisticAnalysis.score}
                  />

                  {analysis.literaryArtisticAnalysis.literaryReferences &&
                   analysis.literaryArtisticAnalysis.literaryReferences.length > 0 && (
                    <div className="pl-4 border-l-2 border-gray-200">
                      <h4 className="text-sm font-medium">Literary References:</h4>
                      <ul className="list-disc pl-5 text-sm">
                        {analysis.literaryArtisticAnalysis.literaryReferences.map((ref, i) => (
                          <li key={i}>{ref}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysis.literaryArtisticAnalysis.artisticConnections &&
                   analysis.literaryArtisticAnalysis.artisticConnections.length > 0 && (
                    <div className="pl-4 border-l-2 border-gray-200">
                      <h4 className="text-sm font-medium">Artistic Connections:</h4>
                      <ul className="list-disc pl-5 text-sm">
                        {analysis.literaryArtisticAnalysis.artisticConnections.map((conn, i) => (
                          <li key={i}>{conn}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Linguistic Analysis */}
              {analysis.linguisticAnalysis && (
                <div className="space-y-2">
                  <AnalysisCategory
                    title="Linguistic Analysis"
                    matches={analysis.linguisticAnalysis.matches}
                    explanation={analysis.linguisticAnalysis.explanation}
                    score={analysis.linguisticAnalysis.score}
                  />

                  {analysis.linguisticAnalysis.phonetics && (
                    <div className="pl-4 border-l-2 border-gray-200">
                      <h4 className="text-sm font-medium">Phonetics:</h4>
                      <p className="text-sm">{analysis.linguisticAnalysis.phonetics}</p>
                    </div>
                  )}

                  {analysis.linguisticAnalysis.pronunciationVariations &&
                   analysis.linguisticAnalysis.pronunciationVariations.length > 0 && (
                    <div className="pl-4 border-l-2 border-gray-200">
                      <h4 className="text-sm font-medium">Pronunciation Variations:</h4>
                      <ul className="list-disc pl-5 text-sm">
                        {analysis.linguisticAnalysis.pronunciationVariations.map((var_item, i) => (
                          <li key={i}>{var_item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Chinese Metaphysics Analysis */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Chinese Metaphysics</h3>

                <AnalysisCategory
                  title="BaZi Analysis"
                  matches={analysis.baziAnalysis?.matches || false}
                  explanation={analysis.baziAnalysis?.explanation || ''}
                  score={analysis.baziAnalysis?.score}
                />

                <AnalysisCategory
                  title="Qi Men Dun Jia Analysis"
                  matches={analysis.qiMenDunJiaAnalysis?.matches || false}
                  explanation={analysis.qiMenDunJiaAnalysis?.explanation || ''}
                  score={analysis.qiMenDunJiaAnalysis?.score}
                />

                <AnalysisCategory
                  title="Feng Shui Analysis"
                  matches={analysis.fengShuiAnalysis?.matches || false}
                  explanation={analysis.fengShuiAnalysis?.explanation || ''}
                  score={analysis.fengShuiAnalysis?.score}
                />

                {/* Five Element Analysis */}
                {analysis.fiveElementAnalysis && (
                  <div className="space-y-2">
                    <AnalysisCategory
                      title="Five Element Analysis"
                      matches={analysis.fiveElementAnalysis.matches}
                      explanation={analysis.fiveElementAnalysis.explanation}
                      score={analysis.fiveElementAnalysis.score}
                    />

                    {analysis.fiveElementAnalysis.associatedElement && (
                      <div className="pl-4 border-l-2 border-gray-200">
                        <h4 className="text-sm font-medium">Associated Element:</h4>
                        <p className="text-sm">{analysis.fiveElementAnalysis.associatedElement}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Western Analysis */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Western Analysis</h3>

                {/* Numerology Analysis */}
                {analysis.numerologyAnalysis && (
                  <div className="space-y-2">
                    <AnalysisCategory
                      title="Numerology Analysis"
                      matches={analysis.numerologyAnalysis.matches}
                      explanation={analysis.numerologyAnalysis.explanation}
                      score={analysis.numerologyAnalysis.score}
                    />

                    <div className="pl-4 border-l-2 border-gray-200 grid grid-cols-2 gap-2">
                      {analysis.numerologyAnalysis.lifePathNumber !== undefined && (
                        <div>
                          <h4 className="text-sm font-medium">Life Path Number:</h4>
                          <p className="text-sm">{analysis.numerologyAnalysis.lifePathNumber}</p>
                        </div>
                      )}

                      {analysis.numerologyAnalysis.personalityNumber !== undefined && (
                        <div>
                          <h4 className="text-sm font-medium">Personality Number:</h4>
                          <p className="text-sm">{analysis.numerologyAnalysis.personalityNumber}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Astrology Analysis */}
                {analysis.astrologyAnalysis && (
                  <div className="space-y-2">
                    <AnalysisCategory
                      title="Astrology Analysis"
                      matches={analysis.astrologyAnalysis.matches}
                      explanation={analysis.astrologyAnalysis.explanation}
                      score={analysis.astrologyAnalysis.score}
                    />

                    <div className="pl-4 border-l-2 border-gray-200 grid grid-cols-2 gap-2">
                      {analysis.astrologyAnalysis.associatedZodiac && (
                        <div>
                          <h4 className="text-sm font-medium">Associated Zodiac:</h4>
                          <p className="text-sm">{analysis.astrologyAnalysis.associatedZodiac}</p>
                        </div>
                      )}

                      {analysis.astrologyAnalysis.planetaryInfluence && (
                        <div>
                          <h4 className="text-sm font-medium">Planetary Influence:</h4>
                          <p className="text-sm">{analysis.astrologyAnalysis.planetaryInfluence}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6">
              <Button onClick={handleAddToFavorites} className="w-full">
                Add to Favorites
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}