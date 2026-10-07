import Image from 'next/image'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import { ArrowRightCircle } from 'lucide-react'
import { BidiText } from '@/components/BidiText'
import { RichText } from '@/components/RichText'
import { ApplicationForm } from '@/components/forms/ApplicationForm'
import type { Dictionary } from '@/i18n/getDictionary'
import { localeHref, type Locale } from '@/i18n/routing'
import careersCopy from '@/i18n/careers.json'
import { englishJobNotice, jobCopyLanguage } from '@/i18n/job-copy'
import type { JobDoc } from '../page-types'
import styles from './careers.module.css'

const people = [
  ['Eslam', 'إسلام', 'Group-1086580-1.png', '#12cce6'],
  ['Mohamed', 'محمد', 'Group-1086581-1.png', '#eebd3d'],
  ['Motaz', 'معتز', 'Group-1086582-1.png', '#fab483'],
  ['Sally', 'سالي', 'Group-1086583-1.png', '#f89ab1'],
  ['Magdy', 'مجدي', 'Group-1171277761.png', '#9dc000'],
  ['Reem', 'ريم', 'Group-1086587-1.png', '#617db5'],
  ['Mai', 'مي', 'Group-1086586-1.png', '#407f88'],
] as const
const jobColors = ['#928af5', '#e52f36', '#85d43d', '#2378bd', '#d99a30', '#0064bc']
// Details shown on the original careers page; other roles keep their CMS metadata.
const sourceDetails: Record<string, { years?: number; positions?: number; urgent?: boolean }> = {
  'senior-wordpress-developer': { years: 5, positions: 2, urgent: true },
  'devops-engineer': { years: 5, positions: 1 },
  'senior-full-stack-engineer': { years: 5, positions: 1 },
  'product-owner-qa': { years: 6, positions: 1 },
  'senior-react-native-engineer': { years: 5, positions: 1 },
  'business-development-specialist': { urgent: true },
}

export function CareerApplication({ job, dict, locale, kind = 'job' }: {
  job: JobDoc; dict: Dictionary; locale: Locale; kind?: 'job' | 'internship' | 'future'
}) {
  const copy = careersCopy[locale]
  return <aside className={styles.application}>
    <h3>{kind === 'internship' ? copy.internshipForm : kind === 'future' ? copy.futureForm : dict.careers.applyNow}</h3>
    <ApplicationForm jobId={job.id} jobTitle={job.title} dict={dict} locale={locale} kind={kind} disabled={job.roleStatus === 'closed'} />
  </aside>
}

export function CareerDescription({ job, locale }: { job: JobDoc; locale: Locale }) {
  return <div className={styles.description} lang={jobCopyLanguage(job, locale)}>
    <RichText data={job.description} />
    <RichText data={job.requirements} />
    <RichText data={job.benefits} />
  </div>
}

export function LegacyCareers({ jobs, dict, locale }: { jobs: JobDoc[]; dict: Dictionary; locale: Locale }) {
  const copy = careersCopy[locale]
  const internship = jobs.find((job) => job.slug === 'internship-program')
  const future = jobs.find((job) => job.slug === 'future-opportunities')
  const openings = jobs.filter((job) => !['internship-program', 'future-opportunities'].includes(job.slug))
  return <div className={styles.careers}>
    <div className={styles.container}>
      <section className={styles.team} aria-labelledby="team-title">
        <h2 id="team-title">{copy.teamTitle}</h2>
        <p className={styles.teamIntro}>{copy.teamBody}</p>
        <div className={styles.family}>
          <Image className={styles.coffeeLeft} src="/images/careers/Group-1.png" width={106} height={141} alt="" />
          <Image className={styles.coffeeRight} src="/images/careers/Group-1.png" width={106} height={141} alt="" />
          <h2>{copy.family}</h2>
          <ul className={styles.people}>
            {people.map(([name, arabicName, asset, color], index) => <li key={name} className={styles.person} style={{ '--person-color': color } as CSSProperties}>
              <div className={styles.portrait}><Image src={`/images/careers/${asset}`} alt="" fill sizes="(max-width: 600px) 40vw, 210px" /></div>
              <div className={styles.personCaption}><h3>{locale === 'ar' ? arabicName : name}</h3><p>{copy.roles[index]}</p></div>
            </li>)}
            <li className={styles.you}><div><h3>{copy.you}</h3><p>{copy.join}</p></div></li>
          </ul>
        </div>
      </section>

      <section id="open-roles" className={styles.openings} aria-labelledby="openings-title">
        <span id="current-openings" className={styles.anchor} />
        <h2 id="openings-title">{copy.openings}</h2>
        <p className={styles.subtitle}>{copy.openingsBody}</p>
        {locale !== 'en' && openings.some((job) => jobCopyLanguage(job, locale) === 'en') ? <p className={styles.subtitle}>{englishJobNotice[locale]}</p> : null}
        <div className={styles.jobs}>
          {openings.length ? openings.map((job, index) => {
            const meta = sourceDetails[job.slug]
            return <details key={job.id} name="career-openings" className={styles.job}>
              <summary>
                <span className={styles.number} style={{ backgroundColor: jobColors[index % jobColors.length] }}>{index + 1}</span>
                <div className={styles.jobSummary}>
                  <h3><span lang={jobCopyLanguage(job, locale)}><BidiText>{job.title}</BidiText></span>{meta ? <span className={styles.badge}>{meta.urgent ? copy.urgent : copy.new}</span> : null}</h3>
                  <div className={styles.meta}>
                    {meta?.years ? <span>{copy.experience} <bdi dir="ltr">{meta.years}+</bdi> {copy.years}</span> : <span>{job.location}</span>}
                    {meta?.positions ? <span>{copy.positions} <bdi>{meta.positions}</bdi></span> : null}
                  </div>
                </div>
                <span className={`${styles.applyButton} fk-button fk-button--career`}>{dict.careers.applyNow}<ArrowRightCircle size={16} aria-hidden className="icon-flip" /></span>
              </summary>
              <div className={styles.jobBody}>
                {/* The form lives on the job page — seven full forms here made one
                    heavy page competing with every job URL (FK-57). */}
                <div><CareerDescription job={job} locale={locale} /><Link className={styles.detailsLink} href={localeHref(locale, `/careers/${job.slug}`)}>{copy.fullDetails}</Link></div>
                <aside className={styles.application}>
                  <Link className={`${styles.applyButton} fk-button fk-button--career`} href={localeHref(locale, `/careers/${job.slug}#apply`)}>{dict.careers.applyNow}<ArrowRightCircle size={16} aria-hidden className="icon-flip" /></Link>
                </aside>
              </div>
            </details>
          }) : <p>{dict.careers.empty}</p>}
        </div>
      </section>

      {([['internship', internship], ['future', future]] as const).map(([kind, job]) => job ? <section key={kind} id={kind === 'internship' ? 'internship-program' : 'future-opportunities'} className={`${styles.opportunity} ${styles[kind]}`}>
        <div className={styles.opportunityInner}>
          <div>
            <h2>{copy[kind]}</h2>
            <p className={styles.subtitle}>{copy[`${kind}Subtitle`]}</p>
            <div className={styles.opportunityCopy}>{copy[`${kind}Body`].split('\n').map((paragraph) => <p key={paragraph}><BidiText>{paragraph}</BidiText></p>)}</div>
          </div>
          <CareerApplication job={job} locale={locale} dict={dict} kind={kind} />
        </div>
      </section> : null)}

    </div>
  </div>
}
